import { GraphQLSchema } from "@webiny/handler-graphql/graphql/abstractions.js";

class Schema implements GraphQLSchema.Interface {
    getTypeDefs() {
        return /* GraphQL */ `
            type Query {
                aiTextWriter: String
            }
        `;
    }

    getResolvers() {
        return {
            Query: {
                aiTextWriter: () => {
                    return `Hello, I'm your assistant! ${Date.now()}`;
                }
            }
        };
    }
}

export const AiWriterGraphQLSchema = GraphQLSchema.createImplementation({
    implementation: Schema,
    dependencies: []
});
