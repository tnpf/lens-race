const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// API endpoint for Vision analysis with SafeSearch
app.post('/api/analyze', async (req, res) => {
    try {
        const { imageData, apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        if (!imageData) {
            return res.status(400).json({ error: 'Image data required' });
        }

        const visionData = await callVisionAPI(imageData, apiKey);
        res.json(visionData);

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

function callVisionAPI(base64Image, apiKey) {
    return new Promise((resolve, reject) => {
        const requestBody = JSON.stringify({
            requests: [{
                image: { content: base64Image },
                features: [
                    { type: 'WEB_DETECTION', maxResults: 30 },
                    { type: 'LABEL_DETECTION', maxResults: 10 },
                    { type: 'SAFE_SEARCH_DETECTION' }
                ],
                imageContext: {
                    webDetectionParams: {
                        includeGeoResults: false
                    }
                }
            }]
        });

        const options = {
            hostname: 'vision.googleapis.com',
            path: `/v1/images:annotate?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode === 200) {
                        resolve(parsed);
                    } else {
                        reject(new Error(JSON.stringify(parsed)));
                    }
                } catch (e) {
                    reject(new Error('Failed to parse API response'));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(requestBody);
        req.end();
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
