import { ErrorResponse, GraphQLSchemaPlugin, Response } from "@webiny/handler-graphql";
import { MailerContext } from "~/types";

const emptyResolver = () => ({});

export const createSettingsGraphQL = () => {
    return new GraphQLSchemaPlugin<MailerContext>({
        typeDefs: `
            type MailerTransportSettingsError {
                message: String!
                code: String
                data: JSON
            }
        
            type MailerTransportSettings {
                host: String
                port: Number
                user: String
                from: String
                replyTo: String
            }
            
            type MailerTransportSettingsResponse {
                data: MailerTransportSettings
                error: MailerTransportSettingsError
            }
        
            type MailerQuery {
                getSettings: MailerTransportSettingsResponse!
            }
            
            input MailerTransportSettingsInput {
                host: String!
                port: Number
                user: String!
                password: String
                from: String!
                replyTo: String
            }
            
            type MailerMutation {
                saveSettings(data: MailerTransportSettingsInput!): MailerTransportSettingsResponse!
            }
            
            extend type Query {
                mailer: MailerQuery
            }
            extend type Mutation {
                mailer: MailerMutation
            }
        `,
        resolvers: {
            Query: {
                mailer: emptyResolver
            },
            MailerQuery: {
                getSettings: async (_, __, context) => {
                    try {
                        const settings = await context.mailer.getSettings();
                        /**
                         * We want to remove the password from the response, if it exists.
                         */
                        if (settings?.password) {
                            // @ts-expect-error
                            delete settings.password;
                        }
                        return new Response(settings);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            },
            Mutation: {
                mailer: emptyResolver
            },
            MailerMutation: {
                saveSettings: async (_, args: any, context) => {
                    try {
                        const settings = await context.mailer.saveSettings({
                            input: args.data
                        });
                        /**
                         * We want to remove the password from the response, if it exists.
                         */
                        if (settings?.password) {
                            // @ts-expect-error
                            delete settings.password;
                        }
                        return new Response(settings);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            }
        }
    });
};
