import { createFeature } from "@webiny/feature/admin";
import { AuthenticationContext as AuthenticationContextAbstraction } from "./abstractions.js";
import { AuthenticationContext } from "./AuthenticationContext.js";
import { AuthenticationMapper } from "./AuthenticationMapper.js";
import { AuthenticationGateway } from "./AuthenticationGateway.js";
import { AuthenticationRepository } from "./AuthenticationRepository.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";
import { InternalIdTokenProvider } from "./InternalIdTokenProvider.js";

export const AuthenticationContextFeature = createFeature({
    name: "AuthenticationContext",
    register(container) {
        container.register(InternalIdTokenProvider).inSingletonScope();
        container.register(AuthenticationMapper).inSingletonScope();
        container.register(AuthenticationGateway).inSingletonScope();
        container.register(AuthenticationRepository).inSingletonScope();
        container.register(AuthenticationContext).inSingletonScope();
        container.registerDecorator(GraphQLClientDecorator);
    },
    resolve(container) {
        return {
            authenticationContext: container.resolve(AuthenticationContextAbstraction)
        };
    }
});
