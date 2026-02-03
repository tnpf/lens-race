const express = require('express');
const cors = require('cors');
const https = require('https');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

let browser = null;

// Initialize browser on startup
async function initBrowser() {
    browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
}

// API endpoint for Vision analysis with SafeSearch + Google Images scraping
app.post('/api/analyze', async (req, res) => {
    try {
        const { imageData, apiKey } = req.body;

        if (!apiKey) {
            return res.status(400).json({ error: 'API key required' });
        }

        if (!imageData) {
            return res.status(400).json({ error: 'Image data required' });
        }

        // Call Google Vision API
        const visionData = await callVisionAPI(imageData, apiKey);
        
        // Extract labels from Vision API response
        const labels = visionData.responses[0]?.labelAnnotations?.map(l => l.description) || [];
        const safeSearch = visionData.responses[0]?.safeSearchAnnotation;
        
        // Check SafeSearch
        if (safeSearch && (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY' ||
            safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY')) {
            return res.json({ 
                responses: [{ 
                    labelAnnotations: [],
                    webDetection: { visuallySimilarImages: [] }
                }]
            });
        }

        // Scrape Google Images for the top label
        const searchTerm = labels[0] || 'nature';
        const imageUrls = await scrapeGoogleImages(searchTerm);

        // Return in format frontend expects
        res.json({
            responses: [{
                labelAnnotations: visionData.responses[0]?.labelAnnotations || [],
                safeSearchAnnotation: safeSearch,
                webDetection: {
                    visuallySimilarImages: imageUrls.map(url => ({ url }))
                }
            }]
        });

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
                    { type: 'LABEL_DETECTION', maxResults: 10 },
                    { type: 'SAFE_SEARCH_DETECTION' }
                ]
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

async function scrapeGoogleImages(query) {
    try {
        if (!browser) {
            await initBrowser();
        }

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&safe=active`;
        await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 10000 });

        // Extract image URLs from the page
        const imageUrls = await page.evaluate(() => {
            const images = [];
            const imgElements = document.querySelectorAll('img[src]');
            
            imgElements.forEach(img => {
                const src = img.src;
                // Get high quality images (not thumbnails)
                if (src && !src.includes('gstatic') && (src.startsWith('http://') || src.startsWith('https://'))) {
                    images.push(src);
                }
            });
            
            return images.slice(0, 30);
        });

        await page.close();
        return imageUrls;

    } catch (error) {
        console.error('Scraping error:', error);
        return [];
    }
}

// Cleanup on exit
process.on('SIGINT', async () => {
    if (browser) await browser.close();
    process.exit();
});

app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await initBrowser();
    console.log('Browser initialized for scraping');
});
