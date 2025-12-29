// api/auth/callback.js
export default async function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ error: 'No authorization code' });
  }
  
  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      throw new Error(tokens.error_description || tokens.error);
    }
    
    // Return success page with tokens
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connected to Google Search Console</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #0A2463 0%, #1E3A8A 100%);
            color: white;
          }
          .container {
            text-align: center;
            background: white;
            color: #0A2463;
            padding: 3rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            max-width: 500px;
          }
          h1 { margin: 0 0 1rem; color: #FF7900; }
          p { margin: 0.5rem 0; }
          .success { font-size: 4rem; margin-bottom: 1rem; }
          button {
            margin-top: 2rem;
            padding: 1rem 2rem;
            background: #FF7900;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
          }
          button:hover { background: #E66D00; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="success">✓</div>
          <h1>Successfully Connected!</h1>
          <p>Google Search Console is now connected to your SEO Content Editor.</p>
          <button onclick="closeWindow()">Close & Return</button>
        </div>
        <script>
          // Store tokens in localStorage
          localStorage.setItem('gsc_access_token', '${tokens.access_token}');
          localStorage.setItem('gsc_refresh_token', '${tokens.refresh_token || ''}');
          localStorage.setItem('gsc_token_expiry', Date.now() + (${tokens.expires_in || 3600} * 1000));
          
          function closeWindow() {
            window.opener.postMessage({ type: 'GSC_CONNECTED', tokens: ${JSON.stringify(tokens)} }, '*');
            window.close();
          }
          
          // Auto-close after 3 seconds
          setTimeout(closeWindow, 3000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
