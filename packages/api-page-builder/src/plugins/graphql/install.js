import { install, isInstalled } from "./installResolver/install";

export default {
    /* GraphQL */
    typeDefs: `
        input PbInstallInput {
            domain: String!
            name: String!
        }
        
        extend type PbQuery {
            # Is Page Builder installed?
            isInstalled: PbBooleanResponse
        }
        
        extend type PbMutation {
            # Install Page Builder (there are x steps because the process takes a long time).
            install(step: Int!, data: PbInstallInput!): PbBooleanResponse
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
