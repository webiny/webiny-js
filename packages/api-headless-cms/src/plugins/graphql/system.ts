import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

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
            upgrade(version: String!): CmsBooleanResponse
        }
    `,
    resolvers: {
        CmsQuery: {
            version: async (_, __, context: CmsContext) => {
                try {
                    return context.cms.getSystemVersion();
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsMutation: {
            install: async (_, __, { cms }: CmsContext) => {
                try {
                    const version = await cms.getSystemVersion();
                    if (version) {
                        return new ErrorResponse({
                            code: "CMS_INSTALLATION_ERROR",
                            message: "CMS is already installed."
                        });
                    }

                    await cms.installSystem();
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            },
            upgrade: async (_, { version }, { cms }: CmsContext) => {
                try {
                    await cms.upgradeSystem(version);
                    return new Response(true);
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        }
    }
};
