import { Result } from "@webiny/feature/api";
import { WebsocketsSendToIdentityUseCase } from "./abstractions.js";

/**
 * The default when no websockets package is installed: there are no connections to send to, so the
 * send succeeds without doing anything. `@webiny/api-websockets` registers after api-core and replaces it.
 */
class NullSendToIdentityUseCaseImpl implements WebsocketsSendToIdentityUseCase.Interface {
    async execute() {
        return Result.ok();
    }
}

export const NullSendToIdentityUseCase = WebsocketsSendToIdentityUseCase.createImplementation({
    implementation: NullSendToIdentityUseCaseImpl,
    dependencies: []
});
