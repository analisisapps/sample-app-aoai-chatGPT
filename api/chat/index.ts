import { AzureFunction, Context, HttpRequest } from "@azure/functions"

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
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
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: { error: (err as Error).message || 'Proxy failed' }
    };
  }
};

export default httpTrigger;
