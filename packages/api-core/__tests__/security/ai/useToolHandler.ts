import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense";
import { useGqlHandler } from "../../useGqlHandler";
import { WebsocketsSendToIdentityUseCase } from "~/features/websockets/index.js";

export interface SentWebsocketMessage {
    identityId: string;
    action?: string;
    data?: unknown;
}

/**
 * Hands a test the request container of an installed, signed-in request, so it can run tools against
 * the real use cases and storage. What the code sent to users' open tabs is recorded, since there is
 * no socket server in tests.
 */
export const useToolHandler = () => {
    const websocketMessages: SentWebsocketMessage[] = [];
    let requestContainer: Container | undefined;

    const captureRequest = (container: Container) => {
        requestContainer = container;
        // In the request container: api-core registers a no-op send there, which would shadow a
        // recorder registered in the root.
        container.registerInstance(WebsocketsSendToIdentityUseCase, {
            async execute(identity, data) {
                websocketMessages.push({
                    identityId: identity.id,
                    action: data.action,
                    data: data.data
                });
                return Result.ok();
            }
        });
    };

    const { install } = useGqlHandler({
        wcpLicense: createTestWcpLicense(),
        registrations: [captureRequest]
    });

    const handler = async () => {
        // The install request leaves its container with the tenant and the identity already set.
        await install.install();

        if (!requestContainer) {
            throw new Error("The install request did not reach the request container.");
        }

        return { container: requestContainer };
    };

    return { handler, websocketMessages };
};
