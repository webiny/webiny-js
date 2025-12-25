import { GraphQLSchema } from "@webiny/handler-graphql/graphql/abstractions.js";
import { IdentityContext } from "webiny/api/security/features/IdentityContext";

class Schema implements GraphQLSchema.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    getTypeDefs() {
        return /* GraphQL */ `
            type Query {
                hello: String
            }
        `;
    }

    getResolvers() {
        return {
            Query: {
                hello: () => {
                    const identity = this.identityContext.getIdentity();
                    return `Hello, ${identity.displayName}!`;
                }
            }
        };
    }
}

export const MyGraphQLSchema = GraphQLSchema.createImplementation({
    implementation: Schema,
    dependencies: [IdentityContext]
});
