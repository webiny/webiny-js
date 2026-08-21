import { HttpRoute } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import type { ModelMessage } from "ai";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { AiChatUseCase } from "./abstractions.js";
import { parseDecisions } from "./approvals.js";
import type { ApprovalDecision } from "./approvals.js";

const BAD_REQUEST_MESSAGE =
    "Provide either a non-empty `prompt` string or a `messages` array of model messages.";

interface ParsedBody {
    messages: ModelMessage[];
    decisions: ApprovalDecision[];
}

const json = (statusCode: number, body: unknown): IHttpResponse => {
    return {
        statusCode,
        headers: { "content-type": "application/json" },
        body
    };
};

const safeParse = (value: string): unknown => {
    try {
        return JSON.parse(value);
    } catch {
        return undefined;
    }
};

/**
 * Accepts either a fresh question or a continuation. A continuation replays `messages` verbatim —
 * including the assistant message carrying the approval request — because the SDK matches an approval
 * response to its request by id, and that request exists nowhere else. We keep no session.
 */
const parseBody = (body: unknown): ParsedBody | null => {
    const raw = typeof body === "string" ? safeParse(body) : body;
    const payload = raw as Record<string, unknown> | undefined;

    if (!payload) {
        return null;
    }

    const decisions = parseDecisions(payload["approvals"]);
    const prompt = payload["prompt"];

    if (typeof prompt === "string" && prompt.trim()) {
        return { messages: [{ role: "user", content: prompt }], decisions };
    }

    const messages = payload["messages"];

    if (!Array.isArray(messages) || messages.length === 0) {
        return null;
    }

    return { messages: messages as ModelMessage[], decisions };
};

/**
 * `POST /ai/chat` — transport only. Parses the request, delegates to `AiChatUseCase`, and maps failures
 * onto status codes. All assistant behaviour lives in the use case.
 */
class AiChatRouteImpl implements HttpRoute.Interface {
    public readonly method = "POST";
    public readonly path = "/ai/chat";

    public constructor(
        private readonly aiChat: AiChatUseCase.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const parsed = parseBody(request.body);

        if (!parsed) {
            return json(400, { error: BAD_REQUEST_MESSAGE });
        }

        try {
            return json(200, await this.aiChat.execute(parsed));
        } catch (error) {
            const code = (error as { code?: string }).code;

            if (code === "NOT_AUTHORIZED") {
                return json(401, { error: "Authentication required." });
            }

            const message = error instanceof Error ? error.message : String(error);
            this.logger.error({ error }, "AI chat request failed.");

            return json(500, { error: message });
        }
    }
}

export const AiChatRoute = HttpRoute.createImplementation({
    implementation: AiChatRouteImpl,
    dependencies: [AiChatUseCase, Logger]
});
