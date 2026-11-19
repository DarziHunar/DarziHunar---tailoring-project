import {
    BadGatewayException,
    GatewayTimeoutException,
    HttpException,
    HttpStatus,
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatRequestDto } from './dto/chat-request.dto';

const SYSTEM_PROMPT = `You are DarziHunar Assistant, the helpful in-app assistant for DarziHunar, a tailoring marketplace in India. Help customers and tailors understand the app's workflows: finding a tailor within the app's nearby search radius, audience categories (Women, Men, Teenagers, Children), fabrics, garment styles, measurements, order requests, tailor quotes, Razorpay checkout, order tracking and profile management. Explain that customers submit a request first; the tailor reviews it and sends an order-specific quote; the customer then pays using the app's secure checkout. Never claim you can access private account, location, payment, order or database information. Never ask for passwords, OTPs, card details, Razorpay secrets or API keys. Do not invent current order status, prices, tailor availability or app features. For account-specific issues, direct the user to the relevant in-app screen or support. Be concise, friendly and practical. Reply in the language used by the user when possible.`;

const RATE_LIMIT_MESSAGE =
    'The AI assistant has reached Groq’s free usage limit for now. Please wait a little and try again.';

@Injectable()
export class AiService {
    constructor(private readonly config: ConfigService) { }

    async chat(dto: ChatRequestDto, _userId: number) {
        const apiKey = this.config.get<string>('GROQ_API_KEY')?.trim();
        if (!apiKey) {
            throw new ServiceUnavailableException(
                'The AI assistant is not configured yet. Add GROQ_API_KEY to the backend environment.',
            );
        }

        const model = this.config.get<string>('GROQ_MODEL')?.trim() || 'openai/gpt-oss-20b';
        const recent = dto.messages
            .slice(-6)
            .map((message) => ({
                role: message.role,
                content: message.content.trim().slice(0, 1200),
            }))
            .filter((message) => message.content.length > 0);

        if (!recent.length || recent[recent.length - 1].role !== 'user') {
            throw new ServiceUnavailableException('Send a message to start the conversation.');
        }

        let response: Response;
        try {
            response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...recent],
                    temperature: 0.4,
                    max_tokens: 400,
                    stream: false,
                }),
                signal: AbortSignal.timeout(25000),
            });
        } catch (error) {
            if (
                error instanceof Error &&
                (error.name === 'TimeoutError' || error.name === 'AbortError')
            ) {
                throw new GatewayTimeoutException(
                    'The AI service took too long to respond. Please try again.',
                );
            }
            throw new ServiceUnavailableException(
                'The AI service is temporarily unreachable. Please try again.',
            );
        }

        if (response.status === HttpStatus.TOO_MANY_REQUESTS) {
            // NestJS @nestjs/common does not export TooManyRequestsException in all
            // supported versions. HttpException + HttpStatus is compatible and
            // returns the standard HTTP 429 status to the mobile client.
            const retryAfter = response.headers.get('retry-after');
            throw new HttpException(
                {
                    statusCode: HttpStatus.TOO_MANY_REQUESTS,
                    message: RATE_LIMIT_MESSAGE,
                    ...(retryAfter ? { retryAfter } : {}),
                },
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        if (!response.ok) {
            // Never forward the provider response body or API key-related details.
            throw new BadGatewayException(
                `The AI provider returned an error (${response.status}). Please try again later.`,
            );
        }

        let payload: { choices?: Array<{ message?: { content?: string } }> };
        try {
            payload = (await response.json()) as {
                choices?: Array<{ message?: { content?: string } }>;
            };
        } catch {
            throw new BadGatewayException('The AI provider returned an invalid response. Please try again.');
        }

        const answer = payload.choices?.[0]?.message?.content?.trim();
        if (!answer) {
            throw new BadGatewayException('The AI provider returned an empty response. Please try again.');
        }

        return { answer, model };
    }
}
