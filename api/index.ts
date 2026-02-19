import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log.info('Proxy request received', req.method, req.url);

  // Handle preflight OPTIONS (SWA usually does it, but we make sure)
  if (req.method === 'OPTIONS') {
    context.res = {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    };
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    context.res = {
      status: 405,
      body: { error: 'Method Not Allowed - Only POST supported' },
      headers: { 'Content-Type': 'application/json' }
    };
    return;
  }

  const body = req.body || {};

  try {

  const endpoint = import.meta.env.VITE_PROMPT_FLOW_ENDPOINT;
  const authKey = import.meta.env.VITE_PROMPT_FLOW_KEY;

    // Optional fallback if env vars are missing (for safety during dev)
  if (!endpoint || !authKey) {
    console.error('Missing env vars: VITE_PROMPT_FLOW_ENDPOINT or VITE_PROMPT_FLOW_KEY');
    return new Response(JSON.stringify({ error: 'Configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
    
    const pfResponse = await fetch('https://analisisappsmx.eastus2.inference.ml.azure.com/score', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authKey 
      },
      body: JSON.stringify(body)
    });

    const data = await pfResponse.json();

    context.res = {
      status: pfResponse.status,
      body: data,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (err) {
    context.log.error('Proxy error:', err);
    context.res = {
      status: 500,
      body: { error: (err as Error).message || 'Proxy failed' },
      headers: { 'Content-Type': 'application/json' }
    };
  }
};

export default httpTrigger;

// This is the trigger config (SWA needs it to recognize the function)
httpTrigger.methods = ['post', 'options'];
httpTrigger.route = 'chat';
httpTrigger.authLevel = 'anonymous';

