import { install, isInstalled } from "./resolvers/install";

export default {
    /* GraphQL */
    typeDefs: `
        input I18NInstallInput {
            code: String!
        }
        
        extend type I18NQuery {
            "Is I18N installed?"
            isInstalled: I18NBooleanResponse
        }
        
        extend type I18NMutation {
            "Install I18N"
            install(data: I18NInstallInput!): I18NBooleanResponse
        }
    `,
    resolvers: {
        I18NQuery: {
            isInstalled
        },
        I18NMutation: {
            install
        }
    }
};
