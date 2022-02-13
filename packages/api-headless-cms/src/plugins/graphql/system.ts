import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

interface CmsMutationUpgradeArgs {
    version: string;
}

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
            version: async (_: any, __: any, context: CmsContext) => {
                try {
                    return context.cms.getSystemVersion();
                } catch (e) {
                    return new ErrorResponse(e);
                }
            }
        },
        CmsMutation: {
            install: async (_: any, __: any, { cms }: CmsContext) => {
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
            upgrade: async (_: any, args: CmsMutationUpgradeArgs, { cms }: CmsContext) => {
                const { version } = args;
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
