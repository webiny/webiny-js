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
                user: String
                from: String
                replyTo: String
            }
            
            type MailerSettingsResponse {
                data: MailerTransportSettings
                error: MailerTransportSettingsError
            }
        
            type MailerQuery {
                getSettings: MailerSettingsResponse!
            }
            
            input TransportSettingsInput {
                host: String!
                user: String!
                password: String
                from: String!
                replyTo: String
            }
            
            type MailerMutation {
                saveSettings(data: TransportSettingsInput!): MailerSettingsResponse!
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
                        const response = await context.mailer.getSettings();
                        return new Response(response);
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
                        const response = await context.mailer.saveSettings({
                            input: args.data
                        });
                        return new Response(response);
                    } catch (ex) {
                        return new ErrorResponse(ex);
                    }
                }
            }
        }
    });
};
