import { install, isInstalled } from "./installResolver/install";

export default {
    /* GraphQL */
    typeDefs: `
        input PbInstallInput {
            domain: String!
            name: String!
        }
        
        extend type PbQuery {
            # Is page-builder installed?
            isInstalled: PbBooleanResponse
        }
        
        extend type PbMutation {
            "Install Pb"
            install(data: PbInstallInput!): PbBooleanResponse
        }
    `,
    resolvers: {
        PbQuery: {
            isInstalled
        },
        PbMutation: {
            install
        }
    }
};
