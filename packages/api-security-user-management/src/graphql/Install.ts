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
        
        type SecurityInstallResponse {
            data: Boolean
            error: SecurityError
        }
        
        extend type SecurityMutation {
            "Install Security"
            install(data: SecurityInstallInput!): SecurityInstallResponse
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
