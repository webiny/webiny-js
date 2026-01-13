import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { IdentityContext } from "webiny/api/security/features/IdentityContext";

class Schema implements GraphQLSchemaFactory.Interface {
    constructor(private identityContext: IdentityContext.Interface) {}

    execute(): GraphQLSchemaFactory.Return {
        return [
            {
                typeDefs: /* GraphQL */ `
                    type Query {
                        hello: String
                    }
                `,
                resolvers: {
                    Query: {
                        hello: () => {
                            const identity = this.identityContext.getIdentity();
                            return `Hello, ${identity.displayName}!`;
                        }
                    }
                }
            }
        ];
    }
}

export const MyGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: [IdentityContext]
});
