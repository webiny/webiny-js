import * as resolvers from "./resolvers";

export default {
    /* GraphQL */
    typeDefs: `
      # ... Here go your type definitions ...
    `,
    resolvers: {
        ...resolvers
    }
};
