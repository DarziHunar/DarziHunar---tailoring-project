import { apiRequest } from './api';

export type AssistantMessage = { role: 'user' | 'assistant'; content: string };
export const aiService = {
    chat(messages: AssistantMessage[], token: string) {
        return apiRequest<{ answer: string; model: string }>('/ai/chat', {
            method: 'POST', token, body: { messages: messages.slice(-10) },
        });
    },
};
