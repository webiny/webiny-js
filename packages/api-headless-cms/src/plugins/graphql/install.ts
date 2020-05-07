import { install, isInstalled } from "./installResolver/install";

export default {
    typeDefs: /* GraphQL */ `
        type CmsBooleanResponse {
            data: Boolean
            error: CmsError
        }

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
