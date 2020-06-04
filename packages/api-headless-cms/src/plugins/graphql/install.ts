import { install, isInstalled } from "./installResolver/install";

export default {
    typeDefs: /* GraphQL */ `
        extend type CmsQuery {
            # Is CMS installed?
            isInstalled: CmsBooleanResponse
        }

        extend type CmsMutation {
            # Install CMS
            install: CmsBooleanResponse
        }
    `,
    resolvers: {
        CmsQuery: { isInstalled },
        CmsMutation: { install }
    }
};
