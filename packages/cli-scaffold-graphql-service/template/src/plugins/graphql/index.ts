import * as resolvers from "./resolvers";

export default {
    /* GraphQL */
    typeDefs: `
        type Unicorn {
            id: ID
            name: String
            weight: Float
        }
        
        getUnicorns: [Unicorn]
        getUnicorn(name: String!): Unicorn
    `,
    resolvers
};
