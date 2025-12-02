// Adapter to reuse existing Netlify-style handlers in Vercel serverless functions
export function adaptNetlifyHandler(netlifyHandler) {
  return async function vercelHandler(req, res) {
    const isBodyAllowed = req.method && !['GET', 'HEAD'].includes(req.method);
    let rawBody;

    if (isBodyAllowed) {
      if (typeof req.body === 'string') {
        rawBody = req.body;
      } else if (req.body) {
        rawBody = JSON.stringify(req.body);
      } else {
        rawBody = '';
      }
    }

    const event = {
      httpMethod: req.method,
      headers: req.headers,
      body: rawBody,
      queryStringParameters: req.query,
      path: req.url
    };

    try {
      const result = await netlifyHandler(event, {});
      const statusCode = result?.statusCode || 200;
      const headers = result?.headers || {};
      Object.entries(headers).forEach(([key, value]) => {
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });
      res.status(statusCode).send(result?.body ?? '');
    } catch (error) {
      console.error('Error in adapted handler:', error);
      res.status(500).send('Internal Server Error');
    }
  };
}
