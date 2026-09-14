import { ApiStreamClient } from "@webiny/app/features/apiStreamClient";
import { readServerSentEvents } from "@webiny/app/features/apiStreamClient";
import { EnvConfig } from "@webiny/app/features/envConfig";
import { AiChatGateway as Abstraction } from "./abstractions.js";
import type { AiChatRequest } from "./abstractions.js";
import type { AiChatStreamEvent } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";

/*
 * The `/stream/` prefix is required, not cosmetic: it is the CloudFront behavior that targets the
 * Lambda Function URL. Any other path lands on API Gateway and gets buffered.
 */
const CHAT_STREAM_PATH = "/stream/ai/chat";

const toBody = (request: AiChatRequest): Record<string, unknown> => {
    const body: Record<string, unknown> = { messages: request.messages };

    if (request.approvals?.length) {
        body["approvals"] = request.approvals;
    }

    return body;
};

/**
 * Talks to the API app's chat routes.
 *
 * Streaming goes through `ApiStreamClient`, so auth and tenant headers come from the platform's own
 * decorators — including `x-webiny-authorization`, which the streaming path needs because on AWS
 * SigV4 occupies `Authorization`. Getting that wrong would silently make every streamed request
 * anonymous.
 *
 * The buffered call still uses `fetch`: `ApiStreamClient` hands back an unread `Response` for a caller
 * that owns a read loop, which is the wrong shape for a single JSON answer.
 */
class AiChatGatewayImpl implements Abstraction.Interface {
    constructor(
        private authContext: AuthenticationContext.Interface,
        private envConfig: EnvConfig.Interface,
        private tenantContext: TenantContext.Interface,
        private streamClient: ApiStreamClient.Interface
    ) {}

    async *stream(request: AiChatRequest, signal?: AbortSignal): AsyncIterable<AiChatStreamEvent> {
        const response = await this.streamClient.execute({
            path: CHAT_STREAM_PATH,
            body: toBody(request),
            signal
        });

        yield* readServerSentEvents<AiChatStreamEvent>(response);
    }
}

export const AiChatGateway = Abstraction.createImplementation({
    implementation: AiChatGatewayImpl,
    dependencies: [AuthenticationContext, EnvConfig, TenantContext, ApiStreamClient]
});
