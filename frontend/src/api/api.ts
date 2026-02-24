import { chatHistorySampleData } from '../constants/chatHistory'

import { ChatMessage, Conversation, ConversationRequest, CosmosDBHealth, CosmosDBStatus, UserInfo } from './models'

/*export async function conversationApi(options: ConversationRequest, abortSignal: AbortSignal): Promise<Response> {
  const response = await fetch('/conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages: options.messages
    }),
    signal: abortSignal
  })

  return response
}*/

export async function conversationApi(options: ConversationRequest, abortSignal: AbortSignal, appName:string): Promise<Response> {
  const userMessage = options.messages[options.messages.length - 1]?.content || '';

  /*Failes due to CORS*/
  /*
  const endpoint = import.meta.env.VITE_PROMPT_FLOW_ENDPOINT;
  const authKey = import.meta.env.VITE_PROMPT_FLOW_KEY;*/


  // Optional fallback if env vars are missing (for safety during dev)
  /*
  if (!endpoint || !authKey) {
    console.error('Missing env vars: VITE_PROMPT_FLOW_ENDPOINT or VITE_PROMPT_FLOW_KEY');
    return new Response(JSON.stringify({ error: 'Configuration error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }*/

    
    /*const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authKey  // ← replace with your real key
      },
      body: JSON.stringify({
        chat_input: userMessage,  // the latest user message
        chat_history: options.messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        app_name: 'Click4Assistance'  // hardcoded for now – will make dynamic later
      }),
      signal: abortSignal
    });*/

  /* Simple proxy workaround*/
  console.log('Historial a enviar...:', options.messages);


// Transformar messages al formato nativo de Prompt Flow chat_history
const pfHistory = [];
  let i = 0;
while (i < options.messages.length) {
  const msg = options.messages[i];

  if (msg.role === 'user') {
    const historyItem: any = {
      inputs: {
        // Usa 'chat_input' si tu flow lo espera así
        // Si en tu flow el input se llama 'question' → cámbialo a 'question'
        chat_input: msg.content
      },
      outputs: {}
    };

    // Si el siguiente mensaje es del assistant → lo agregamos como output
    if (i + 1 < options.messages.length && options.messages[i + 1].role === 'assistant') {
      historyItem.outputs = {
        // Usa 'answer' si tu LLM node devuelve 'answer'
        // Si se llama 'reply', 'output' u otro nombre → cámbialo aquí
        chat_output: options.messages[i + 1].content
      };
      i += 2; // saltamos el par completo
    } else {
      i += 1; // solo user (el mensaje actual pendiente)
    }

    pfHistory.push(historyItem);
  } else {
    // Por seguridad: si por algún motivo empieza con assistant, lo saltamos
    i += 1;
  }
}

  console.log('Enviando historial en formato Prompt Flow:', JSON.stringify({
    chat_input: userMessage,
    chat_history: pfHistory,
    app_name: appName
  }))
  const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chat_input: userMessage,
    //chat_history: options.messages.map(m => ({ role: m.role, content: m.content })),
    chat_history: pfHistory,
    app_name: appName
  }),
  signal: abortSignal
});

if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Proxy error ${response.status}: ${errorText}`);
}

  
return response;

}

export async function getUserInfo(): Promise<UserInfo[]> {
  const response = await fetch('/.auth/me')
  if (!response.ok) {
    console.log('No identity provider found. Access to chat will be blocked.')
    return []
  }

  const payload = await response.json()
  return payload
}

// export const fetchChatHistoryInit = async (): Promise<Conversation[] | null> => {
export const fetchChatHistoryInit = (): Conversation[] | null => {
  // Make initial API call here

  return chatHistorySampleData
}

/*export const historyList = async (offset = 0): Promise<Conversation[] | null> => {
  const response = await fetch(`/history/list?offset=${offset}`, {
    method: 'GET'
  })
    .then(async res => {
      const payload = await res.json()
      if (!Array.isArray(payload)) {
        console.error('There was an issue fetching your data.')
        return null
      }
      const conversations: Conversation[] = await Promise.all(
        payload.map(async (conv: any) => {
          let convMessages: ChatMessage[] = []
          convMessages = await historyRead(conv.id)
            .then(res => {
              return res
            })
            .catch(err => {
              console.error('error fetching messages: ', err)
              return []
            })
          const conversation: Conversation = {
            id: conv.id,
            title: conv.title,
            date: conv.createdAt,
            messages: convMessages
          }
          return conversation
        })
      )
      return conversations
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return null
    })

  return response
}*/
export const historyList = async (offset = 0): Promise<Conversation[] | null> => {
  // await fetch('/history/list?offset=${offset}')
  return []; // Mock: no history
};

/*export const historyRead = async (convId: string): Promise<ChatMessage[]> => {
  const response = await fetch('/history/read', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async res => {
      if (!res) {
        return []
      }
      const payload = await res.json()
      const messages: ChatMessage[] = []
      if (payload?.messages) {
        payload.messages.forEach((msg: any) => {
          const message: ChatMessage = {
            id: msg.id,
            role: msg.role,
            date: msg.createdAt,
            content: msg.content,
            feedback: msg.feedback ?? undefined
          }
          messages.push(message)
        })
      }
      return messages
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return []
    })
  return response
}*/
export const historyRead = async (convId: string): Promise<ChatMessage[]> => {
  // await fetch('/history/read')
  return []; // Mock: no messages
};
/*export const historyGenerate = async (
  options: ConversationRequest,
  abortSignal: AbortSignal,
  convId?: string
): Promise<Response> => {
  let body
  if (convId) {
    body = JSON.stringify({
      conversation_id: convId,
      messages: options.messages
    })
  } else {
    body = JSON.stringify({
      messages: options.messages
    })
  }
  const response = await fetch('/history/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: body,
    signal: abortSignal
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return new Response()
    })
  return response
}*/

export const historyGenerate = async (
  options: ConversationRequest,
  abortSignal: AbortSignal,
  convId?: string
): Promise<Response> => {
  // await fetch('/history/generate')
  return new Response(JSON.stringify({}), { status: 200 }); // Mock success
};

/*export const historyUpdate = async (messages: ChatMessage[], convId: string): Promise<Response> => {
  const response = await fetch('/history/update', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId,
      messages: messages
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(async res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}*/
export const historyUpdate = async (messages: ChatMessage[], convId: string): Promise<Response> => {
  // await fetch('/history/update')
  return new Response(JSON.stringify({}), { status: 200 });
};

/*export const historyDelete = async (convId: string): Promise<Response> => {
  const response = await fetch('/history/delete', {
    method: 'DELETE',
    body: JSON.stringify({
      conversation_id: convId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}*/
export const historyDelete = async (convId: string): Promise<Response> => {
  return new Response(JSON.stringify({}), { status: 200 });
};

/*export const historyDeleteAll = async (): Promise<Response> => {
  const response = await fetch('/history/delete_all', {
    method: 'DELETE',
    body: JSON.stringify({}),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}*/
export const historyDeleteAll = async (): Promise<Response> => {
  return new Response(JSON.stringify({}), { status: 200 });
};

/*export const historyClear = async (convId: string): Promise<Response> => {
  const response = await fetch('/history/clear', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}*/
export const historyClear = async (convId: string): Promise<Response> => {
  // await fetch('/history/clear')
  return new Response(JSON.stringify({}), { status: 200 });
};

/*export const historyRename = async (convId: string, title: string): Promise<Response> => {
  const response = await fetch('/history/rename', {
    method: 'POST',
    body: JSON.stringify({
      conversation_id: convId,
      title: title
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}*/
export const historyRename = async (convId: string, title: string): Promise<Response> => {
  return new Response(JSON.stringify({}), { status: 200 });
};

/*export const historyEnsure = async (): Promise<CosmosDBHealth> => {
  const response = await fetch('/history/ensure', {
    method: 'GET'
  })
    .then(async res => {
      const respJson = await res.json()
      let formattedResponse
      if (respJson.message) {
        formattedResponse = CosmosDBStatus.Working
      } else {
        if (res.status === 500) {
          formattedResponse = CosmosDBStatus.NotWorking
        } else if (res.status === 401) {
          formattedResponse = CosmosDBStatus.InvalidCredentials
        } else if (res.status === 422) {
          formattedResponse = respJson.error
        } else {
          formattedResponse = CosmosDBStatus.NotConfigured
        }
      }
      if (!res.ok) {
        return {
          cosmosDB: false,
          status: formattedResponse
        }
      } else {
        return {
          cosmosDB: true,
          status: formattedResponse
        }
      }
    })
    .catch(err => {
      console.error('There was an issue fetching your data.')
      return {
        cosmosDB: false,
        status: err
      }
    })
  return response
}*/
export const historyEnsure = async (): Promise<CosmosDBHealth> => {
  return { cosmosDB: false, status: CosmosDBStatus.NotConfigured };
};

/*export const frontendSettings = async (): Promise<Response | null> => {
  const response = await fetch('/frontend_settings', {
    method: 'GET'
  })
    .then(res => {
      return res.json()
    })
    .catch(_err => {
      console.error('There was an issue fetching your data.')
      return null
    })

  return response
}*/
export const frontendSettings = async (): Promise<Response | null> => {
  // await fetch('/frontend_settings')
  return new Response(JSON.stringify({}), { status: 200 }); // Mock empty settings
};

export const historyMessageFeedback = async (messageId: string, feedback: string): Promise<Response> => {
  const response = await fetch('/history/message_feedback', {
    method: 'POST',
    body: JSON.stringify({
      message_id: messageId,
      message_feedback: feedback
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  })
    .then(res => {
      return res
    })
    .catch(_err => {
      console.error('There was an issue logging feedback.')
      const errRes: Response = {
        ...new Response(),
        ok: false,
        status: 500
      }
      return errRes
    })
  return response
}
