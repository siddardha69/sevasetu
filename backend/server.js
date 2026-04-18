const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// GET / - Health check
app.get('/', (req, res) => {
    res.send('<h1>SevaSetu AI Backend is Running!</h1><p>All AI endpoints are active.</p>');
});

/**
 * POST /api/analyze-complaint
 * Enhanced: AI analysis + sentiment + escalation detection
 */
app.post('/api/analyze-complaint', async (req, res) => {
    const { text, imageBase64, mimeType } = req.body;

    if (!text && !imageBase64) {
        return res.status(400).json({ success: false, message: 'Text or image is required' });
    }

    try {
        const prompt = `
        You are an AI assistant for SevaSetu — India's Government Grievance Portal.
        Analyze the following citizen complaint carefully.

        Text Description: ${text || 'None provided.'}

        If an image is provided, analyze it to understand the context and severity of the issue.

        Respond with ONLY a valid JSON object with exactly these keys:
        {
            "aiAnalysis": "Brief professional 1-2 sentence summary of the core issue",
            "aiClassification": "Recommended department from: Water Board, Electricity, Roads & Transport, Municipal Services, Health, Education, Other",
            "aiClusteringTag": "A 2-3 word tag to cluster similar issues (e.g., 'Pothole Repair', 'Power Outage', 'Water Supply')",
            "aiPriorityScore": integer from 1 to 10 (10 being most urgent),
            "aiPriorityLevel": "High", "Medium", or "Low",
            "sentimentScore": float from -1.0 (very distressed/angry) to 1.0 (neutral/calm),
            "escalationReason": "One sentence reason to escalate (e.g., 'Citizen mentions safety risk to children') or null if no escalation needed"
        }
        `;

        const contents = [{ role: 'user', parts: [{ text: prompt }] }];

        if (imageBase64) {
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            contents[0].parts.push({
                inlineData: { data: base64Data, mimeType: mimeType || 'image/jpeg' }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents,
            config: { responseMimeType: 'application/json' }
        });

        const aiData = JSON.parse(response.text);
        return res.status(200).json({ success: true, data: aiData });

    } catch (error) {
        console.error('Analyze Complaint Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to analyze complaint', error: error.message });
    }
});

/**
 * POST /api/chat
 * AI Chatbot — Setu, the citizen assistant
 */
app.post('/api/chat', async (req, res) => {
    const { message, history, complaints } = req.body;

    if (!message) {
        return res.status(400).json({ success: false, message: 'Message is required' });
    }

    try {
        const systemContext = `You are Setu, a friendly and helpful AI assistant for SevaSetu — India's Government Grievance Portal.

You help citizens with:
1. How to submit complaints and what information is needed
2. Looking up complaint status by ID (like GD-2024-XXXXX)
3. Knowing which department handles which type of issue
4. Understanding the grievance process and expected timelines
5. General FAQs about the portal

Current complaints in the system for context:
${JSON.stringify((complaints || []).slice(0, 15))}

Guidelines:
- Be concise, warm, and professional
- If asked about a specific complaint ID, look it up in the complaints list above and share the status
- If you cannot find a complaint, say so politely and suggest they double-check the ID
- Do NOT make up complaint statuses or information
- Respond in under 80 words unless explaining a process
- Use simple, clear language appropriate for all citizens`;

        const contents = [];

        // Add conversation history
        if (history && history.length > 0) {
            history.slice(-8).forEach(msg => {
                contents.push({ role: msg.role, parts: [{ text: msg.text }] });
            });
        }

        // Add current message with system context
        contents.push({
            role: 'user',
            parts: [{ text: `${systemContext}\n\nCitizen's message: ${message}` }]
        });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents
        });

        return res.status(200).json({ success: true, reply: response.text });

    } catch (error) {
        console.error('Chat API Error:', error);
        return res.status(500).json({ success: false, message: 'Chat service temporarily unavailable' });
    }
});

/**
 * POST /api/recommend-officer
 * AI Smart Officer Routing
 */
app.post('/api/recommend-officer', async (req, res) => {
    const { complaint, officers, allComplaints } = req.body;

    if (!complaint || !officers) {
        return res.status(400).json({ success: false, message: 'Complaint and officers list are required' });
    }

    try {
        // Compute open workload per officer
        const workload = {};
        officers.forEach(o => { workload[o.name] = 0; });
        if (allComplaints) {
            allComplaints.forEach(c => {
                if (c.officer && c.officer !== 'Unassigned' && c.status !== 'Resolved') {
                    workload[c.officer] = (workload[c.officer] || 0) + 1;
                }
            });
        }

        const prompt = `You are an AI system that recommends the best government officer to handle a citizen grievance.

Complaint Details:
- Department Required: ${complaint.department}
- Priority Level: ${complaint.aiData?.aiPriorityLevel || complaint.priority || 'Medium'}
- Issue Type: ${complaint.aiData?.aiClusteringTag || 'General'}
- Description: ${complaint.description || 'N/A'}
- Area: ${complaint.area}

Available Officers (with current open case count):
${officers.map(o => `- ${o.name} | Department: ${o.department} | Open Cases: ${workload[o.name] || 0}`).join('\n')}

Rank ALL officers by suitability. Primary factor: department match. Secondary: lower workload.

Respond with ONLY a valid JSON array (include all officers ranked):
[
    {
        "name": "Officer Name",
        "score": integer 1-10,
        "reason": "Brief one-sentence explanation"
    }
]`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        const recommendations = JSON.parse(response.text);
        return res.status(200).json({ success: true, recommendations });

    } catch (error) {
        console.error('Officer Recommendation Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to get officer recommendations' });
    }
});

/**
 * POST /api/detect-duplicate
 * AI Duplicate Complaint Detection
 */
app.post('/api/detect-duplicate', async (req, res) => {
    const { newComplaint, existingComplaints } = req.body;

    if (!newComplaint || !existingComplaints) {
        return res.status(400).json({ success: false, message: 'Complaint data required' });
    }

    try {
        // Only check recent open complaints for efficiency
        const openComplaints = existingComplaints
            .filter(c => c.status !== 'Resolved')
            .slice(0, 25);

        if (openComplaints.length === 0) {
            return res.status(200).json({ success: true, isDuplicate: false, matchedId: null, confidence: 0, reason: 'No open complaints to compare' });
        }

        const prompt = `You are an AI duplicate detection system for a government grievance portal.

New Complaint Being Submitted:
- Department: ${newComplaint.department}
- Area: ${newComplaint.area}
- Description: "${newComplaint.description}"
- Cluster Tag: ${newComplaint.aiClusteringTag || 'N/A'}

Existing Open Complaints (check for similarity):
${openComplaints.map(c => `ID: ${c.id} | Dept: ${c.department} | Area: ${c.area} | Tag: ${c.aiData?.aiClusteringTag || 'N/A'} | Desc: "${c.description.substring(0, 100)}"`).join('\n')}

A complaint is a DUPLICATE if it has the SAME department, overlapping area, AND same type of issue.
Small wording differences are fine — focus on the actual problem being reported.

Respond with ONLY a valid JSON object:
{
    "isDuplicate": boolean,
    "matchedId": "GD-XXXX-XXXXX if duplicate, or null",
    "confidence": integer 0-100,
    "reason": "Brief explanation of your decision"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text);
        return res.status(200).json({ success: true, ...result });

    } catch (error) {
        console.error('Duplicate Detection Error:', error);
        // Fail safe — don't block submission
        return res.status(200).json({ success: true, isDuplicate: false, matchedId: null, confidence: 0, reason: 'Detection unavailable' });
    }
});

/**
 * POST /api/generate-report
 * AI-Powered Executive Analytics Summary
 */
app.post('/api/generate-report', async (req, res) => {
    const { stats } = req.body;

    if (!stats) {
        return res.status(400).json({ success: false, message: 'Stats object required' });
    }

    try {
        const prompt = `You are an AI analyst generating an executive summary for a Government Grievance Management System called SevaSetu.

Current System Data:
${JSON.stringify(stats, null, 2)}

Write a concise 3-4 sentence executive summary covering:
1. Overall performance (total complaints, resolution rate)
2. The most critical department or issue requiring attention
3. One specific, actionable recommendation for administrators

Write in formal government report style. Be specific with numbers from the data.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        return res.status(200).json({ success: true, report: response.text });

    } catch (error) {
        console.error('Report Generation Error:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate AI report' });
    }
});

/**
 * POST /api/predict-resolution
 * AI Resolution Time Predictor
 */
app.post('/api/predict-resolution', async (req, res) => {
    const { department, priorityLevel, clusterTag, similarOpenCount } = req.body;

    try {
        const prompt = `You are an AI resolution time predictor for India's Government Grievance Portal (SevaSetu).

Complaint Details:
- Department: ${department}
- Priority Level: ${priorityLevel}
- Issue Type / Cluster: ${clusterTag}
- Similar open complaints in system: ${similarOpenCount || 0}

Based on realistic government grievance resolution patterns in India, predict:
1. Estimated number of working days to resolution
2. Confidence level based on priority and department
3. A single helpful, actionable tip for the citizen

Respond with ONLY a valid JSON object:
{
    "estimatedDays": integer (realistic government timeline),
    "confidence": "High", "Medium", or "Low",
    "suggestion": "One actionable tip for the citizen, max 20 words"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: 'application/json' }
        });

        const prediction = JSON.parse(response.text);
        return res.status(200).json({ success: true, ...prediction });

    } catch (error) {
        console.error('Resolution Prediction Error:', error);
        return res.status(500).json({ success: false, message: 'Prediction unavailable' });
    }
});

/**
 * POST /call
 * OmniDimension AI Voice Call
 */
app.post('/call', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    console.log(`Received AI call request for: ${phone}`);

    const API_KEY = process.env.OMNIDIM_API_KEY;
    const AGENT_ID = Number(process.env.OMNIDIM_AGENT_ID);
    const API_URL = 'https://backend.omnidim.io/api/v1/calls/dispatch';

    try {
        const response = await axios.post(API_URL, {
            to_number: phone,
            agent_id: AGENT_ID
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('OmniDimension Response:', response.data);
        return res.status(200).json({ success: true, message: 'AI call initiated successfully', data: response.data });

    } catch (error) {
        console.error('OmniDimension Error:', error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.message || 'Failed to initiate AI call';
        return res.status(500).json({ success: false, message: errorMessage });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 SevaSetu AI Backend running on http://localhost:${PORT}`);
    console.log('📡 Active AI Endpoints:');
    console.log('  POST /api/analyze-complaint  — Complaint analysis + sentiment');
    console.log('  POST /api/chat               — Setu AI Chatbot');
    console.log('  POST /api/recommend-officer  — Smart officer routing');
    console.log('  POST /api/detect-duplicate   — Duplicate detection');
    console.log('  POST /api/generate-report    — Analytics executive summary');
    console.log('  POST /api/predict-resolution — Resolution time prediction');
    console.log('  POST /call                   — OmniDimension voice call');
    console.log('\nPress Ctrl+C to stop\n');
});
