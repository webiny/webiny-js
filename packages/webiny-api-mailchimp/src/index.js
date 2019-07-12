// @flow
import { gql } from "apollo-server-lambda";
import { EntityModel } from "webiny-entity";
import { settingsFactory } from "webiny-api/entities";
import { dummyResolver, resolveGetSettings, resolveSaveSettings } from "webiny-api/graphql";
import { ListErrorResponse, ListResponse, ErrorResponse } from "webiny-api/graphql";
import { hasScope } from "webiny-api-security";
import got from "got";

const Mailchimp = function({ apiKey }) {
    this.apiKey = apiKey;

    this.isValidApiKey = async () => {
        try {
            await this.get({
                path: `/lists/`
            });
            return true;
        } catch (e) {
            return false;
        }
    };

    this.get = ({ path }) => {
        return this.request({ path, method: "get" });
    };

    this.post = ({ path, body }) => {
        return this.request({ path, body, method: "post" });
    };

    this.request = ({ path, method, body }: Object) => {
        // eslint-disable-next-line
        const [, dataCenter] = this.apiKey.split("-");
        return got(`https://${dataCenter}.api.mailchimp.com/3.0` + path, {
            method,
            json: true,
            body,
            headers: {
                authorization: "apikey " + this.apiKey
            }
        });
    };
};

const mailchimpSettingsModelFactory = parent => {
    return class MailchimpSettingsModel extends EntityModel {
        apiKey: ?string;
        enabled: ?boolean;
        constructor() {
            super();
            this.setParentEntity(parent);
            this.attr("enabled").boolean();
            this.attr("apiKey")
                .char()
                .onSet(value => {
                    if (value && value !== this.apiKey) {
                        this.getParentEntity()
                            .on("beforeSave", async () => {
                                const mailchimp = new Mailchimp({ apiKey: value });
                                const valid = await mailchimp.isValidApiKey();
                                if (!valid) {
                                    throw Error("API key invalid.");
                                }
                            })
                            .setOnce();
                    }
                    return value;
                });
        }
    };
};

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

                type MailchimpMutation {
                    # Add a new member to members list.
                    addToList(list: String!, email: String!): MailchimpAddToListResponse
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
                }

                extend type SettingsQuery {
                    mailchimp: MailchimpSettingsResponse
                }

                extend type SettingsMutation {
                    mailchimp(data: MailchimpSettingsInput): MailchimpSettingsResponse
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
                        if (!settings || !(await settings.get("data.apiKey"))) {
                            throw Error("Mailchimp API key not set.");
                        }

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
                },
                SettingsQuery: {
                    mailchimp: (_: any, args: Object, ctx: Object, info: Object) => {
                        const entity = ctx.getEntity("MailchimpSettings");
                        return resolveGetSettings(entity)(_, args, ctx, info);
                    }
                },
                SettingsMutation: {
                    mailchimp: (_: any, args: Object, ctx: Object, info: Object) => {
                        const entity = ctx.getEntity("MailchimpSettings");
                        return resolveSaveSettings(entity)(_, args, ctx, info);
                    }
                }
            }
        },
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
                }
            }
        }
    },
    {
        type: "entity",
        name: "entity-mailchimp-settings",
        entity: (...args: Array<any>) => {
            return class MailchimpSettings extends settingsFactory(...args) {
                static key = "mailchimp";
                static classId = "MailchimpSettings";
                static collectionName = "Settings";

                data: Object;
                load: Function;

                constructor() {
                    super();
                    this.attr("data").model(mailchimpSettingsModelFactory(this));
                }
            };
        }
    }
];
