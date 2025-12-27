import { createFeature } from "@webiny/feature/admin";
import { AuthenticationContext as AuthenticationContextAbstraction } from "./abstractions.js";
import { AuthenticationContext } from "./AuthenticationContext.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";

export const AuthenticationContextFeature = createFeature({
    name: "AuthenticationContext",
    register(container) {
        container.register(AuthenticationContext).inSingletonScope();
        container.registerDecorator(GraphQLClientDecorator);
    },
    resolve(container) {
        return {
            authenticationContext: container.resolve(AuthenticationContextAbstraction)
        };
    }
});
