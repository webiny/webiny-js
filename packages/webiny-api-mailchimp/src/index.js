// @flow
import { gql } from "apollo-server-lambda";
import { dummyResolver, resolveGetSettings, resolveUpdateSettings } from "webiny-api/graphql";
import { ListErrorResponse, ListResponse, ErrorResponse } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import mailchimpSettingsEntity from "./MailchimpSettings.entity";
import MailchimpApi from "./MailchimpApi";

export default [
    {
        name: "graphql-schema-mailchimp",
        type: "graphql-schema",
        schema: {
            typeDefs: gql`
                type MailchimpSettings {
                    enabled: Boolean
                    apiKey: String
                }

                type MailchimpSettingsResponse {
                    data: MailchimpSettings
                    error: MailchimpError
                }

                input MailchimpSettingsInput {
                    enabled: Boolean
                    apiKey: String
                }

                type MailchimpListMeta {
                    totalCount: Int
                    totalPages: Int
                    page: Int
                    perPage: Int
                    from: Int
                    to: Int
                    previousPage: Int
                    nextPage: Int
                }

                type MailchimpError {
                    code: String
                    message: String
                    data: JSON
                }

                type MailchimpAddToListResponse {
                    error: MailchimpError
                }

                type MailchimpList {
                    id: String
                    name: String
                }

                type MailchimpListsResponse {
                    data: [MailchimpList]
                    meta: MailchimpListMeta
                    error: MailchimpError
                }

                type MailchimpQuery {
                    listLists: MailchimpListsResponse
                    getSettings: MailchimpSettingsResponse
                }

                type MailchimpMutation {
                    # Add a new member to members list.
                    addToList(list: String!, email: String!): MailchimpAddToListResponse
                    updateSettings(data: MailchimpSettingsInput): MailchimpSettingsResponse
                }
                
                extend type Query {
                    mailchimp: MailchimpQuery
                }

                extend type Mutation {
                    mailchimp: MailchimpMutation
                }
            `,
            resolvers: {
                Query: {
                    mailchimp: dummyResolver
                },
                Mutation: {
                    mailchimp: dummyResolver
                },
                MailchimpQuery: {
                    listLists: async (
                        _: any,
                        args: Object,
                        { mailchimp: { entities } }: Object
                    ) => {
                        const { MailchimpSettings } = entities;
                        const settings = await MailchimpSettings.load();
                        if (!settings || !(await settings.get("data.apiKey"))) {
                            throw Error("Mailchimp API key not set.");
                        }

                        const mailchimp = new MailchimpApi({ apiKey: settings.data.apiKey });

                        try {
                            const listsResponse = await mailchimp.get({
                                path: `/lists/`
                            });

                            const output = listsResponse.body.lists.map(item => ({
                                id: item.id,
                                name: item.name
                            }));

                            return new ListResponse(output);
                        } catch (e) {
                            return new ListErrorResponse(e);
                        }
                    },
                    getSettings: resolveGetSettings("MailchimpSettings")
                },
                MailchimpMutation: {
                    addToList: async (
                        _: any,
                        { list: listId, email }: Object,
                        { mailchimp: { entities } }: Object
                    ) => {
                        const { MailchimpSettings } = entities;

                        const settings = await MailchimpSettings.load();
                        if (!settings || !(await settings.get("data.apiKey"))) {
                            throw Error("Mailchimp API key not set.");
                        }

                        const mailchimp = new MailchimpApi({ apiKey: settings.data.apiKey });

                        try {
                            const listResponse = await mailchimp.get({
                                path: `/lists/${listId}`
                            });

                            await mailchimp.post({
                                path: `/lists/${listId}/members`,
                                body: {
                                    email_address: email,
                                    status: listResponse.body.double_optin
                                        ? "pending"
                                        : "subscribed"
                                }
                            });
                        } catch (e) {
                            if (e.body) {
                                return new ErrorResponse({
                                    message: e.body.title,
                                    data: {
                                        code: e.body.status,
                                        detail: e.body.detail,
                                        type: e.body.type
                                    }
                                });
                            }

                            return new ErrorResponse({
                                message: e.message
                            });
                        }
                    },
                    updateSettings: resolveUpdateSettings("MailchimpSettings")
                }
            }
        },
        security: {
            shield: {
                MailchimpQuery: {
                    listLists: hasScope("cms:editor"),
                    getSettings: hasScope("cms:settings")
                },
                MailchimpMutation: {
                    updateSettings: hasScope("cms:settings")
                }
            }
        }
    },
    {
        type: "entity",
        name: "entity-mailchimp-settings",
        entity: mailchimpSettingsEntity
    }
];
