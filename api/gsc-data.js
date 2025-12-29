// api/gsc-data.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { targetUrl, accessToken, propertyUrl } = req.body;
  
  if (!targetUrl || !accessToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 28);
  
  const siteUrl = propertyUrl || 'sc-domain:geniusmonkey.com';
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: startDate.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['query', 'page'],
          dimensionFilterGroups: [{
            filters: [{
              dimension: 'page',
              expression: targetUrl,
              operator: 'equals'
            }]
          }],
          rowLimit: 25
        })
      }
    );
    
    const data = await response.json();
    
    if (data.error) {
      return res.status(response.status).json({ error: data.error.message });
    }
    
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
