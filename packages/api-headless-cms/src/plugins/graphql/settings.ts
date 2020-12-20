import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "@webiny/api-headless-cms/types";

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
        CmsQuery: {
            isInstalled: async (_, __, context: CmsContext) => {
                try {
                    const settings = await context.cms.settings.get();
                    return new Response(!!settings?.isInstalled);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsMutation: {
            install: async (_, __, context: CmsContext) => {
                try {
                    await context.cms.settings.install();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
};
