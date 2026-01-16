const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Google Generative AI with API Key
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

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

const cleanJsonString = (str) => {
  // Remove markdown code blocks if present
  let cleanStr = str.replace(/```json/g, '').replace(/```/g, '');
  return cleanStr.trim();
};

const wait = (ms) => new Promise(res => setTimeout(res, ms));

async function callGeminiWithRetry(model, promptOrParts, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await model.generateContent(promptOrParts);
            return result.response; 
        } catch (error) {
            console.warn(`[Gemini Attempt ${i+1}/${maxRetries} Failed] Status: ${error.status}`);
            
            // Robust check for 503/429
            const isServiceUnavailable = error.status === 503 || error.status === 429 || error.status === 500;
            const isOverloaded = error.message && error.message.includes('Overloaded');
            const isRetryable = isServiceUnavailable || isOverloaded;
            
            if (isRetryable && i < maxRetries - 1) {
                let delay = Math.pow(2, i) * 1000 + (Math.random() * 1000);
                let isRateLimit = false;

                // Check for explicit RetryInfo in errorDetails
                if (error.errorDetails && Array.isArray(error.errorDetails)) {
                    const retryInfo = error.errorDetails.find(d => 
                        d['@type'] === 'type.googleapis.com/google.rpc.RetryInfo' || 
                        (d['@type'] && d['@type'].includes('RetryInfo'))
                    );
                    
                    if (retryInfo && retryInfo.retryDelay) {
                        const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
                        if (!isNaN(seconds)) {
                            delay = (seconds * 1000) + (Math.random() * 500); // Add small jitter
                            isRateLimit = true;
                            console.warn(`[Rate Limit] API requested wait of ${retryInfo.retryDelay}. Waiting ${Math.round(delay)}ms...`);
                        }
                    }
                }

                if (!isRateLimit) {
                    console.warn(`Gemini Busy / Overloaded. Waiting ${Math.round(delay)}ms before retry...`);
                }
                
                await wait(delay);
                continue;
            }
            throw error; // If not retryable or out of attempts, throw
        }
    }
}

exports.convertResumeFile = async (req, res, next) => {
  try {
    const { base64Data, mimeType, jobDescription } = req.body;
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = getResumeStructurePrompt(jobDescription) + 
                   " Recreate this resume perfectly with an optimized section order for the target role. Return JSON with candidateName, htmlContent, and rawText.";

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    const response = await callGeminiWithRetry(model, [prompt, imagePart]);
    const text = response.text();
    
    // Ensure we parse the JSON correctly
    const jsonResponse = JSON.parse(cleanJsonString(text));

    res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Gemini Conversion Error:", error);
    next(new Error(`Failed to process resume file: ${error.message}`));
  }
};

exports.createResumeFromText = async (req, res, next) => {
  try {
    const { pastedText, jobDescription } = req.body;
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash", 
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = getResumeStructurePrompt(jobDescription) + 
                   ` Transform this raw text into structured resume HTML (JSON format). \n\n ${pastedText}`;

    const response = await callGeminiWithRetry(model, prompt);
    const text = response.text();

    const jsonResponse = JSON.parse(cleanJsonString(text));

    res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Gemini Text Structure Error:", error);
    next(new Error(`Failed to structure text: ${error.message}`));
  }
};

exports.improveResumeContent = async (req, res, next) => {
  try {
    const { currentHtml, instruction, jobDescription } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Update the following Resume HTML to address: "${instruction}".
      Target JD: ${jobDescription || 'None'}
      Current HTML: ${currentHtml}
      Return ONLY the updated HTML string. Preserve header structure and links. Do NOT return markdown formatting.
    `;

    const response = await callGeminiWithRetry(model, prompt);
    const text = response.text();

    res.status(200).json({ html: cleanJsonString(text) });
  } catch (error) {
    console.error("Improvement Error:", error);
    next(new Error("Failed to apply improvement."));
  }
};

exports.reorderResumeSections = async (req, res, next) => {
  try {
    const { currentHtml, jobDescription } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze the following Resume HTML and the Target Job Description.
      Target JD: ${jobDescription}
      Current HTML: ${currentHtml}
      
      TASK: Reorder the H2 sections (EXPERIENCE, EDUCATION, SKILLS, PROJECTS, etc.) to maximize ATS impact for the specific JD.
      - If the role is entry-level, prioritize Education.
      - If the role is highly technical and the candidate has matching skills, prioritize Skills.
      - Otherwise, lead with Experience.
      - Keep all content identical, only move the blocks.
      - Return ONLY the reordered HTML string. Do NOT return markdown formatting.
    `;

    const response = await callGeminiWithRetry(model, prompt);
    const text = response.text();

    res.status(200).json({ html: cleanJsonString(text) });
  } catch (error) {
    console.error("Reorder Error:", error);
    next(new Error("Failed to reorder sections."));
  }
};

exports.getATSFeedback = async (req, res, next) => {
  try {
    const { resumeText, jobDescription } = req.body;
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `Analyze resume text for ATS compatibility. Score 0-100. Text: ${resumeText}. JD: ${jobDescription || 'None'}. Return JSON with score, improvements (array), suggestedKeywords (array), redFlags (array), jdMatchAnalysis (string).`;

    const response = await callGeminiWithRetry(model, prompt);
    const text = response.text();

    const jsonResponse = JSON.parse(cleanJsonString(text));

    res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Feedback Error:", error);
    next(error);
  }
};

