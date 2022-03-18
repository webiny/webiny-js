import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import { Response, ErrorResponse } from "@webiny/handler-graphql/responses";
import { PbContext } from "../../types";

export const createInstallGraphQL = (): GraphQLSchemaPlugin<PbContext> => {
    return {
        type: "graphql-schema",
        schema: {
            typeDefs: /* GraphQL */ `
                input PbInstallInput {
                    insertDemoData: Boolean
                    websiteUrl: String
                    name: String!
                }

                type PbInstallResponse {
                    data: Boolean
                    error: PbError
                }

                type PbUpgradeResponse {
                    data: Boolean
                    error: PbError
                }

                extend type PbQuery {
                    # Get installed version
                    version: String
                }

                extend type PbMutation {
                    # Install Page Builder (there are x steps because the process takes a long time).
                    install(data: PbInstallInput!): PbInstallResponse

                    # Upgrade Page Builder to a newer version
                    upgrade(version: String!): PbUpgradeResponse
                }
            `,
            resolvers: {
                PbQuery: {
                    version: async (_, __, context) => {
                        const { tenancy, pageBuilder } = context;
                        if (!tenancy.getCurrentTenant()) {
                            return null;
                        }

                        return pageBuilder.getSystemVersion();
                    }
                },
                PbMutation: {
                    install: async (_, args: any, context) => {
                        try {
                            await context.pageBuilder.installSystem({
                                name: args.data.name,
                                insertDemoData:
                                    "insertDemoData" in args ? args.insertDemoData : true
                            });
                            return new Response(true);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    },
                    upgrade: async (_, args: any, context) => {
                        try {
                            await context.pageBuilder.upgradeSystem(args.version);
                            return new Response(true);
                        } catch (e) {
                            return new ErrorResponse(e);
                        }
                    }
                }
            }
        }
    };
};
