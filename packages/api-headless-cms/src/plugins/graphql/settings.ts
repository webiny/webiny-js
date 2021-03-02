import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "../../types";

export default {
    typeDefs: /* GraphQL */ `
        extend type CmsQuery {
            # Get installed version
            version: String
        }

        extend type CmsMutation {
            # Install CMS
            install: CmsBooleanResponse

            # Upgrade CMS
            upgrade(version: String, data: JSON): CmsBooleanResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            version: async (_, __, context: CmsContext) => {
                try {
                    return context.cms.system.getVersion();
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsMutation: {
            install: async (_, __, { cms }: CmsContext) => {
                try {
                    const version = await cms.system.getVersion();
                    if (version) {
                        return new ErrorResponse({
                            code: "CMS_INSTALLATION_ERROR",
                            message: "CMS is already installed."
                        });
                    }

                    await cms.settings.install();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            upgrade: async (_, { version, data }, { cms }: CmsContext) => {
                // TODO: verify that the given version is indeed the next applicable upgrade
            }
        }
    }
};
