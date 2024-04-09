import { ErrorResponse, Response } from "@webiny/handler-graphql";
import { I18NContext } from "~/types";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";

export const createInstallationGraphQL = (): GraphQLSchemaPlugin<I18NContext> => {
    return {
        type: "graphql-schema",
        name: "graphql-schema-i18n-installation",
        schema: {
            typeDefs: /* GraphQL */ `
                input I18NInstallInput {
                    code: String!
                }

                extend type I18NQuery {
                    "Get installed version"
                    version: String
                }

                extend type I18NMutation {
                    "Install I18N"
                    install(data: I18NInstallInput!): I18NBooleanResponse
                }
            `,
            resolvers: {
                I18NQuery: {
                    version: async (_, __, context) => {
                        const { tenancy, i18n } = context;
                        if (!tenancy.getCurrentTenant()) {
                            return null;
                        }

                        const version = await i18n.system.getSystemVersion();
                        return version ? "true" : null;
                    }
                },
                I18NMutation: {
                    install: async (_, args: any, context) => {
                        try {
                            await context.i18n.system.installSystem(args.data);
                        } catch (e) {
                            return new ErrorResponse({
                                code: e.code,
                                message: e.message,
                                data: e.data
                            });
                        }

                        return new Response(true);
                    }
                }
            }
        }
    };
};
