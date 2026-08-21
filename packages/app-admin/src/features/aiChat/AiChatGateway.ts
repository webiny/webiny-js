import { EnvConfig } from "@webiny/app/features/envConfig";
import { AiChatGateway as Abstraction } from "./abstractions.js";
import type { AiChatRequest, AiChatResult } from "./abstractions.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";

/**
 * Calls the API app's `/ai/chat` route.
 *
 * Sources endpoint, token and tenant exactly as `WebinySdk` does, so the assistant runs as the signed-in
 * user. That identity is what gates every tool the server then calls — the browser holds no API key and
 * cannot widen its own access.
 */
class AiChatGatewayImpl implements Abstraction.Interface {
    constructor(
        private authContext: AuthenticationContext.Interface,
        private envConfig: EnvConfig.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(request: AiChatRequest): Promise<AiChatResult> {
        const endpoint = this.envConfig.get("apiUrl").replace(/\/$/, "");
        const token = (await this.authContext.getIdToken()) ?? "";

        const response = await fetch(`${endpoint}/ai/chat`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                authorization: `Bearer ${token}`,
                "x-tenant": this.tenantContext.getCurrentTenant() || "root"
            },
            body: JSON.stringify({
                messages: request.messages,
                ...(request.approvals?.length ? { approvals: request.approvals } : {})
            })
        });

        const payload = await response.json().catch(() => undefined);

        if (!response.ok) {
            // The route reports failures as `{ error }`; surface that text so the user sees the real
            // reason (missing provider key, no permission) instead of a bare status code.
            const reason =
                (payload as { error?: string } | undefined)?.error ??
                `Request failed with status ${response.status}.`;
            throw new Error(reason);
        }

        const result = payload as Partial<AiChatResult> | undefined;

        return {
            text: result?.text ?? "",
            toolCalls: result?.toolCalls ?? [],
            steps: result?.steps ?? 0,
            pendingApprovals: result?.pendingApprovals ?? [],
            messages: result?.messages ?? [],
            writesEnabled: result?.writesEnabled ?? false
        };
    }
}

export const AiChatGateway = Abstraction.createImplementation({
    implementation: AiChatGatewayImpl,
    dependencies: [AuthenticationContext, EnvConfig, TenantContext]
});
