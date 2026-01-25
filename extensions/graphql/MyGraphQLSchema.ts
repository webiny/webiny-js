import { GraphQLSchemaFactory } from "webiny/api/graphql";
import { IdentityContext } from "webiny/api/security";

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

const MyGraphQLSchema = GraphQLSchemaFactory.createImplementation({
    implementation: Schema,
    dependencies: [IdentityContext]
});

export default MyGraphQLSchema;
