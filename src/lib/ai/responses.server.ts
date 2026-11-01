import { streamResponse, GatewayError } from '@lovable.dev/ai-gateway';
import { assistantOutputSchema } from '@/lib/assistant-schema';

const schema = {
  type: 'object', additionalProperties: false, required: ['reply', 'proposal', 'table', 'suggestions'],
  properties: {
    reply: { type: 'string' },
    proposal: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['type', 'amount', 'description', 'occurred_on', 'category_id', 'status'], properties: {
      type: { type: 'string', enum: ['income', 'expense', 'transfer'] }, amount: { type: ['number', 'null'] }, description: { type: ['string', 'null'] }, occurred_on: { type: ['string', 'null'] }, category_id: { type: ['string', 'null'] }, status: { type: 'string', enum: ['paid', 'pending'] },
    } }] },
    table: { anyOf: [{ type: 'null' }, { type: 'object', additionalProperties: false, required: ['title', 'columns', 'rows'], properties: { title: { type: 'string' }, columns: { type: 'array', maxItems: 4, items: { type: 'string' } }, rows: { type: 'array', maxItems: 12, items: { type: 'array', maxItems: 4, items: { type: 'string' } } } } }] },
    suggestions: { type: 'array', maxItems: 3, items: { type: 'string' } },
  },
};

export async function createResponsesCall(request: Request, messages: { role: 'user' | 'assistant'; content: string }[], instructions: string) {
  try {
    const stream = await streamResponse({
      model: 'openai/gpt-6-astra',
      input: messages.map(m => ({ role: m.role, content: m.role === 'assistant' ? [{ type: 'output_text' as const, text: m.content, annotations: [] }] : m.content })),
      instructions, reasoning: { effort: 'low', summary: 'auto' }, include: ['reasoning.encrypted_content'],
      text: { format: { type: 'json_schema', name: 'patrion_assistant', strict: true, schema } },
    }, { signal: request.signal, maxRetries: 0 });
    for await (const event of stream) {
      if (event.type === 'response.completed') {
        const text = event.response.output.flatMap(item => item.type === 'message' ? item.content.flatMap(c => c.type === 'output_text' ? [c.text] : []) : []).join('');
        return assistantOutputSchema.parse(JSON.parse(text));
      }
    }
    throw new Error('Resposta incompleta do assistente.');
  } catch (error) {
    if (error instanceof GatewayError) console.error('Patrion AI request failed', { code: error.code, ids: error.ids });
    throw error;
  }
}