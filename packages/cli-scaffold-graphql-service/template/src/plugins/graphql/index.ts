import resolvers from "./resolvers";

export default {
    typeDefs: /* GraphQL */ `
        type Unicorn {
            id: ID
            name: String
            weight: Float
        }

        type Query {
            getUnicorns: [Unicorn]
            getUnicorn(name: String!): Unicorn
        }
    `,
    resolvers
};
