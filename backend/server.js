const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(express.json({limit: '50mb'})); // Parse JSON request bodies with higher limit for images

// GET / - Simple health check
app.get('/', (req, res) => {
    res.send('<h1>GrievanceDesk Backend is Running!</h1><p>Ready to handle call requests.</p>');
});

/**
 * POST /api/analyze-complaint
 * AI Analysis Endpoint
 */
app.post('/api/analyze-complaint', async (req, res) => {
    const { text, imageBase64, mimeType } = req.body;

    if (!text && !imageBase64) {
        return res.status(400).json({ success: false, message: 'Text or image is required' });
    }

    try {
        const prompt = `
        You are an AI assistant for a Government Grievance Portal.
        Analyze the following citizen complaint.
        
        Text Description: ${text || 'None provided.'}
        
        If an image is provided, analyze the image to understand the context and severity of the issue.

        Respond with ONLY a JSON object with exactly these keys:
        {
            "aiAnalysis": "Brief professional summary of the core issue",
            "aiClassification": "Recommended department (e.g., Water Board, Electricity, Roads & Transport, Municipal Services, Health, Education, Other)",
            "aiClusteringTag": "A 2-3 word tag to cluster similar issues (e.g., 'Pothole', 'Power Outage')",
            "aiPriorityScore": integer from 1 to 10 (10 being most urgent),
            "aiPriorityLevel": "High", "Medium", or "Low"
        }
        `;

        const contents = [{ role: 'user', parts: [{ text: prompt }] }];

        if (imageBase64) {
            // Strip the data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
            contents[0].parts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: mimeType || 'image/jpeg'
                }
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const jsonStr = response.text;
        const aiData = JSON.parse(jsonStr);

        return res.status(200).json({
            success: true,
            data: aiData
        });

    } catch (error) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to analyze complaint with AI',
            error: error.message || error.toString()
        });
    }
});

/**
 * POST /call
 * Endpoint to receive phone number from frontend and trigger OmniDimension API
 */
app.post('/call', async (req, res) => {
    const { phone } = req.body;

    // 1. Basic validation
    if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    console.log(`Received call request for: ${phone}`);

    // 2. OmniDimension API Configuration
    const API_KEY = process.env.OMNIDIM_API_KEY;
    const AGENT_ID = Number(process.env.OMNIDIM_AGENT_ID); // Agent ID should be a number
    const API_URL = 'https://backend.omnidim.io/api/v1/calls/dispatch';

    try {
        // 3. Send request to OmniDimension
        const response = await axios.post(API_URL, {
            to_number: phone,
            agent_id: AGENT_ID
        }, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('OmniDimension API Response:', response.data);

        // 4. Return success to frontend
        return res.status(200).json({
            success: true,
            message: 'Call initiated successfully',
            data: response.data
        });

    } catch (error) {
        // 5. Error Handling
        console.error('OmniDimension API Error:', error.response ? error.response.data : error.message);
        
        const errorMessage = error.response && error.response.data && error.response.data.message 
            ? error.response.data.message 
            : 'Failed to initiate AI call';

        return res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop');
});
