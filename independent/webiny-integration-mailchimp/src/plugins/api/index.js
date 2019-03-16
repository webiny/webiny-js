// @flow
import { Model } from "webiny-model";
import { settingsFactory } from "webiny-api/entities";
import { dummyResolver } from "webiny-api/graphql";
import { ListErrorResponse, ListResponse, ErrorResponse } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import got from "got";

const Mailchimp = function({ apiKey }) {
    this.apiKey = apiKey;

    this.get = ({ path }) => {
        return this.request({ path, method: "get" });
    };

    this.post = ({ path, body }) => {
        return this.request({ path, body, method: "post" });
    };

    this.request = ({ path, method, body }) => {
        return got("https://us19.api.mailchimp.com/3.0" + path, {
            method,
            json: true,
            body,
            headers: {
                authorization: "apikey " + this.apiKey
            }
        });
    };
};

class MailchimpSettingsModel extends Model {
    constructor() {
        super();
        this.attr("enabled").boolean();
        this.attr("apiKey").char();
    }
}

export default [
    {
        name: "schema-settings-mailchimp",
        type: "schema-settings",
        namespace: "mailchimp",
        typeDefs: /* GraphQL */ `
            type MailchimpSettings {
                enabled: Boolean
                apiKey: String
            }

            input MailchimpSettingsInput {
                enabled: Boolean
                apiKey: String
            }

            extend type SettingsQuery {
                mailchimp: MailchimpSettings
            }

            extend type SettingsMutation {
                mailchimp(data: MailchimpSettingsInput): MailchimpSettings
            }
        `,
        entity: ({
            mailchimp: {
                entities: { MailchimpSettings }
            }
        }: Object) => MailchimpSettings
    },
    {
        type: "entity",
        name: "entity-mailchimp-settings",
        namespace: "mailchimp",
        entity: {
            name: "MailchimpSettings",
            factory: (...args: Array<any>) => {
                return class MailchimpSettings extends settingsFactory(...args) {
                    static key = "mailchimp";

                    data: Object;
                    load: Function;

                    constructor() {
                        super();
                        this.attr("data").model(MailchimpSettingsModel);
                    }
                };
            }
        }
    },
    {
        type: "graphql",
        name: "graphql-mailchimp",
        namespace: "mailchimp",
        security: {
            shield: {
                SettingsQuery: {
                    mailchimp: hasScope("cms:settings")
                },
                SettingsMutation: {
                    mailchimp: hasScope("cms:settings")
                },
                MailchimpQuery: {
                    listLists: hasScope("cms:editor")
                },
                MailchimpMutation: {
                    addToList: hasScope("cms:editor")
                }
            }
        },
        typeDefs: () => [
            /* GraphQL */ `
                type AddToListResponse {
                    error: Error
                }

                type MailchimpMutation {
                    # Add a new member to members list.
                    addToList(list: String!, email: String!): AddToListResponse
                }

                type Mutation {
                    mailchimp: MailchimpMutation
                }

                type List {
                    id: String
                    name: String
                }

                type ListsResponse {
                    data: [List]
                    meta: ListMeta
                    error: Error
                }

                type MailchimpQuery {
                    listLists: ListsResponse
                }

                type Query {
                    mailchimp: MailchimpQuery
                }
            `
        ],
        resolvers: () => [
            {
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
                        const mailchimp = new Mailchimp({ apiKey: settings.data.apiKey });

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
                    }
                },
                MailchimpMutation: {
                    addToList: async (
                        _: any,
                        { list: listId, email }: Object,
                        { mailchimp: { entities } }: Object
                    ) => {
                        const { MailchimpSettings } = entities;

                        const settings = await MailchimpSettings.load();
                        const mailchimp = new Mailchimp({ apiKey: settings.data.apiKey });

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
                    }
                }
            }
        ]
    }
];
