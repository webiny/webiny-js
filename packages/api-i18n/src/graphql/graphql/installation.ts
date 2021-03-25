import { ErrorResponse, Response } from "@webiny/handler-graphql/responses";
import { SecurityContext } from "@webiny/api-security/types";
import { I18NContext } from "../types";

export default {
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
            version: async (_, __, context: I18NContext & SecurityContext) => {
                const { security, i18n } = context;
                if (!security.getTenant()) {
                    return null;
                }

                return i18n.system.getVersion();
            }
        },
        I18NMutation: {
            install: async (_, args, context: I18NContext) => {
                const { i18n } = context;

                try {
                    await i18n.locales.create({ code: args.data.code, default: true });
                    await i18n.locales.updateDefault(args.data.code);
                    await i18n.system.setVersion(context.WEBINY_VERSION);
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
};
