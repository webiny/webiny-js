import { install, isInstalled } from "./installResolvers/install";

export default {
    /* GraphQL */
    typeDefs: `
        input SecurityInstallInput {
            firstName: String!
            lastName: String!
            email: String!
        }
        
        extend type SecurityQuery {
            "Is Security installed?"
            isInstalled: SecurityBooleanResponse
        }
        
        extend type SecurityMutation {
            "Install Security"
            install(data: SecurityInstallInput!): SecurityBooleanResponse
        }
    `,
    resolvers: {
        SecurityQuery: {
            isInstalled
        },
        SecurityMutation: {
            install
        }
    }
};
