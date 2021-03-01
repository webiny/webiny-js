import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "../../types";

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
                    // we are disabling auth here because we only require isInstalled flag
                    const settings = await context.cms.settings.noAuth().get();
                    return new Response(!!settings?.isInstalled);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsMutation: {
            install: async (_, __, { cms }: CmsContext) => {
                try {
                    await cms.settings.install();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
};
