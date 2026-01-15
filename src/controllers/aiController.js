const { GoogleGenAI, Type } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "AIzaSyAM5sYAOjLUfA0hUKIjD8ycatbQGSMioaQ" });

const getResumeStructurePrompt = (jobDescription) => `
    Convert the provided document (Image or PDF) into structured HTML for a resume.
    
    ${jobDescription ? `TARGET JOB DESCRIPTION:\n${jobDescription}\n` : ''}

    CRITICAL STRUCTURAL RULES:
    1. Header: Use this EXACT structure for the contact info:
       <div class="header-grid">
         <div class="header-left">
           <h1>[Candidate Name]</h1>
           <p>[Website URL or Portfolio]</p>
         </div>
         <div class="header-right">
           Email: [Email]<br>
           Mobile: [Phone]
         </div>
       </div>
    2. SECTION SEQUENCING: 
       Analyze the content vs the target JD. 
       - If the JD is highly technical and the candidate is a career-changer, place SKILLS/PROJECTS above EXPERIENCE.
       - If the candidate is a student/recent grad, place EDUCATION above EXPERIENCE.
       - Otherwise, use the standard order: SUMMARY -> EXPERIENCE -> SKILLS -> EDUCATION.
    3. Experience Items: Each job should start with an H3 containing "<span class='job-title'>Title</span> <span class='location'>City, State</span>".
       Follow it with a <div class='role-line'><span>Company Name</span> <span>Dates</span></div>.
    4. Section Headers: Must be in H2 (e.g., EDUCATION, EXPERIENCE, PROJECTS).
    5. Hyperlinks: Detect URLs for projects or social profiles and wrap text in <a href="...">.
    6. Content: Ensure professional, high-impact bullet points.
    7. Clean semantic tags: H1, H2, H3, P, UL, LI, A, STRONG, SPAN.
`;

exports.convertResumeFile = async (req, res, next) => {
  try {
    const { base64Data, mimeType, jobDescription } = req.body;
    const modelName = "gemini-2.5-flash"; 

    // Note: User used "gemini-3-flash-preview" which might not exist or be private. 
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: getResumeStructurePrompt(jobDescription) + " Recreate this resume perfectly with an optimized section order for the target role." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            htmlContent: { type: Type.STRING },
            rawText: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["candidateName", "htmlContent", "rawText"]
        }
      }
    });

    res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    console.error("Gemini Conversion Error:", error);
    next(new Error("Failed to process resume file."));
  }
};

exports.createResumeFromText = async (req, res, next) => {
  try {
    const { pastedText, jobDescription } = req.body;
    const modelName = "gemini-flash-latest";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: getResumeStructurePrompt(jobDescription) + ` Transform this raw text into structured resume HTML with the most relevant section first: \n\n ${pastedText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            candidateName: { type: Type.STRING },
            htmlContent: { type: Type.STRING },
            rawText: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["candidateName", "htmlContent", "rawText"]
        }
      }
    });

    res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    next(new Error("Failed to structure text."));
  }
};

exports.improveResumeContent = async (req, res, next) => {
  try {
    const { currentHtml, instruction, jobDescription } = req.body;
    const modelName = "gemini-flash-latest";

    const prompt = `
      Update the following Resume HTML to address: "${instruction}".
      Target JD: ${jobDescription || 'None'}
      Current HTML: ${currentHtml}
      Return ONLY the updated HTML string. Preserve header structure and links.
    `;

    const response = await ai.models.generateContent({ 
      model: modelName, 
      contents: prompt 
    });

    res.status(200).json({ html: response.text });
  } catch (error) {
    next(new Error("Failed to apply improvement."));
  }
};

exports.reorderResumeSections = async (req, res, next) => {
  try {
    const { currentHtml, jobDescription } = req.body;
    const modelName = "gemini-flash-latest"; // Using Pro equivalent

    const prompt = `
      Analyze the following Resume HTML and the Target Job Description.
      Target JD: ${jobDescription}
      Current HTML: ${currentHtml}
      
      TASK: Reorder the H2 sections (EXPERIENCE, EDUCATION, SKILLS, PROJECTS, etc.) to maximize ATS impact for the specific JD.
      - If the role is entry-level, prioritize Education.
      - If the role is highly technical and the candidate has matching skills, prioritize Skills.
      - Otherwise, lead with Experience.
      - Keep all content identical, only move the blocks.
      - Return ONLY the reordered HTML string.
    `;

    const response = await ai.models.generateContent({ 
      model: modelName, 
      contents: prompt
    });

    res.status(200).json({ html: response.text });
  } catch (error) {
    next(new Error("Failed to reorder sections."));
  }
};

exports.getATSFeedback = async (req, res, next) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const modelName = "gemini-flash-latest";

    const prompt = `Analyze resume text for ATS compatibility. Score 0-100. Text: ${resumeText}. JD: ${jobDescription || 'None'}`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
            jdMatchAnalysis: { type: Type.STRING }
          },
          required: ["score", "improvements", "suggestedKeywords", "redFlags", "jdMatchAnalysis"]
        }
      }
    });

    res.status(200).json(JSON.parse(response.text));
  } catch (error) {
    next(error);
  }
};
