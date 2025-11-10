
import { GoogleGenAI, Type } from "@google/genai";
import type { CandidateScreeningResult, Resume, ComparisonAnalysis } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const screeningSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: {
                type: Type.STRING,
                description: "The candidate's full name, extracted from the resume.",
            },
            match_score: {
                type: Type.INTEGER,
                description: "A matching percentage from 0 to 100 indicating how well the candidate matches the job description.",
            },
            summary: {
                type: Type.STRING,
                description: "A concise, one-paragraph summary of the candidate's fit for the role.",
            },
            strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of specific skills or experiences that match the job description.",
            },
            weaknesses: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of key requirements from the job description that are missing from the resume.",
            },
            red_flags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of any potential concerns (e.g., job gaps, lack of required qualifications).",
            },
        },
        required: ["name", "match_score", "summary", "strengths", "weaknesses", "red_flags"],
    },
};

const comparisonSchema = {
    type: Type.OBJECT,
    properties: {
        overall_recommendation: {
            type: Type.STRING,
            description: "A detailed paragraph recommending the top candidate(s) and justifying the choice based on the comparison and the job description."
        },
        comparison_table: {
            type: Type.ARRAY,
            description: "A side-by-side comparison of the candidates across key criteria relevant to the job description.",
            items: {
                type: Type.OBJECT,
                properties: {
                    criteria: {
                        type: Type.STRING,
                        description: "The comparison criteria (e.g., 'Relevant Experience with React', 'Cloud Platform Knowledge', 'Leadership Potential')."
                    },
                    assessments: {
                        type: Type.ARRAY,
                        description: "An assessment for each candidate for the given criteria.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: {
                                    type: Type.STRING,
                                    description: "The name of the candidate."
                                },
                                assessment: {
                                    type: Type.STRING,
                                    description: "The candidate's assessment for this specific criteria, summarizing how they meet it."
                                }
                            },
                            required: ["name", "assessment"]
                        }
                    }
                },
                required: ["criteria", "assessments"]
            }
        }
    },
    required: ["overall_recommendation", "comparison_table"]
};


const fileToGenerativePart = async (file: File) => {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });

    return {
        inlineData: {
            mimeType: file.type,
            data: base64EncodedData,
        },
    };
};

export const screenCandidates = async (jobDescription: string | File, resumes: Resume[]): Promise<CandidateScreeningResult[]> => {
    const promptHeader = `
        You are an expert technical recruiter with 20 years of experience. Your task is to analyze candidate resumes against a provided job description. Evaluate each candidate strictly based on the provided texts. Do not invent information.

        **JOB DESCRIPTION:**
        ---
    `;

    const jobDescriptionFooter = `
        ---

        **CANDIDATE RESUMES:**
    `;

    const promptFooter = `
        For each resume, provide a detailed analysis in JSON format according to the provided schema. The JSON must be an array of objects, one for each candidate resume provided.
    `;
    
    const jobDescriptionPart = typeof jobDescription === 'string'
        ? { text: jobDescription }
        : await fileToGenerativePart(jobDescription);

    const promptParts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [
        { text: promptHeader },
        jobDescriptionPart,
        { text: jobDescriptionFooter }
    ];

    for (const [index, resume] of resumes.entries()) {
        promptParts.push({ text: `\n\n--- RESUME ${index + 1} ---\n` });
        if (resume.file) {
            try {
                const filePart = await fileToGenerativePart(resume.file);
                promptParts.push(filePart);
            } catch (error) {
                console.error(`Error processing file for resume ${index + 1}:`, error);
                throw new Error(`Failed to read file for candidate ${index + 1}. Please try again.`);
            }
        } else {
            promptParts.push({ text: resume.content });
        }
    }

    promptParts.push({ text: promptFooter });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: promptParts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: screeningSchema,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResults = JSON.parse(jsonText);
        
        return parsedResults as CandidateScreeningResult[];

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get screening results from the AI model. Please check the console for more details.");
    }
};

export const compareCandidates = async (jobDescription: string | File, selectedResults: CandidateScreeningResult[]): Promise<ComparisonAnalysis> => {
    const candidateSummaries = selectedResults.map(r => 
        `CANDIDATE: ${r.name}\nMATCH SCORE: ${r.match_score}\nSUMMARY: ${r.summary}\nSTRENGTHS: ${r.strengths.join(', ')}\nWEAKNESSES: ${r.weaknesses.join(', ')}\n`
    ).join('\n---\n');

    const prompt = `
        You are an experienced hiring manager responsible for making a final decision. Your task is to compare a shortlist of candidates for a specific role.
        
        First, review the job description carefully. Then, review the provided summaries for each shortlisted candidate.
        
        Provide a final recommendation and a detailed, side-by-side comparison table. Focus on the most critical requirements from the job description.

        **JOB DESCRIPTION:**
        ---
        ${typeof jobDescription === 'string' ? jobDescription : 'Provided as a file.'}
        ---

        **SHORTLISTED CANDIDATES:**
        ---
        ${candidateSummaries}
        ---

        Please provide your analysis in JSON format according to the schema.
    `;

    // FIX: Explicitly type `promptParts` to allow both text and inlineData objects to avoid type inference errors.
    const promptParts: ({ text: string; } | { inlineData: { mimeType: string; data: string; }; })[] = [{ text: prompt }];

    if (typeof jobDescription !== 'string') {
        try {
            const filePart = await fileToGenerativePart(jobDescription);
            // Insert after the main prompt text
            promptParts.push(filePart);
        } catch (error) {
            console.error(`Error processing job description file for comparison:`, error);
            throw new Error(`Failed to read the job description file. Please try again.`);
        }
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ parts: promptParts }],
            config: {
                responseMimeType: "application/json",
                responseSchema: comparisonSchema,
            },
        });

        const jsonText = response.text.trim();
        const parsedResult = JSON.parse(jsonText);
        return parsedResult as ComparisonAnalysis;

    } catch (error) {
        console.error("Error calling Gemini API for comparison:", error);
        throw new Error("Failed to get comparison analysis from the AI model. Please check the console.");
    }
};