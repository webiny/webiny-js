import { HandlerContextPlugin } from "@webiny/handler/types";
import { HandlerContextDb } from "@webiny/handler-db/types";
import { HandlerI18NContentContext } from "@webiny/api-i18n-content/types";
import KSUID from "ksuid";
import { withFields, string } from "@commodo/fields";
import { object } from "commodo-fields-object";
import { validation } from "@webiny/validation";
import defaults from "./defaults";
export type Page = {
    id: string;
    title: string;
    snippet: string;
    url: string;
    category: string;
    published: boolean;
    publishedOn: string;
    version: number;
    latestVersion: boolean;
    settings: Record<string, any>;
    locked: boolean;
    createdOn: string;
    createdBy: {
        id: string;
        displayName: string;
    };
};

const CreateDataModel = withFields({
    title: string({
        value: "Untitled",
        validation: validation.create("required,maxLength:150")
    }),
    url: string({ validation: validation.create("required,maxLength:100") }),
    category: string({ validation: validation.create("required,maxLength:100") })
})();

const UpdateDataModel = withFields({
    title: string({
        value: "Untitled",
        validation: validation.create("maxLength:150")
    }),
    snippet: string({ validation: validation.create("maxLength:500") }),
    url: string({ validation: validation.create("maxLength:100") }),
    category: string({ validation: validation.create("maxLength:100") }),
    content: object(),
    settings: object(),
    tags: string({
        list: true,
        validation: value => {
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    validation.validateSync(value[i], "maxLength:50");
                }
            }
        }
    })
})();

const ITEM_TYPE = "pb#page";

const sorters = {
    CREATED_ON_ASC: { createdOn: "asc" },
    CREATED_ON_DESC: { createdOn: "desc" }
};

export default {
    type: "context",
    apply(context) {
        const { db, i18nContent, elasticSearch } = context;
        const PK_PAGE = `P#${i18nContent?.locale?.code}`;

        context.pages = {
            async get(id: string) {
                const [[page]] = await db.read<Page>({
                    ...defaults.db,
                    query: { PK: PK_PAGE, SK: id },
                    limit: 1
                });

                return page;
            },

            async list(args) {
                const { limit = 44, sort, search = "", types = [], tags = [], ids = [] } = args;

                const must = [];
                if (Array.isArray(types) && types.length) {
                    must.push({ terms: { "type.keyword": types } });
                }

                if (search) {
                    must.push({
                        bool: {
                            should: [
                                { wildcard: { name: `*${search}*` } },
                                { terms: { tags: search.toLowerCase().split(" ") } }
                            ]
                        }
                    });
                }

                if (Array.isArray(tags) && tags.length > 0) {
                    must.push({
                        terms: { "tags.keyword": tags.map(tag => tag.toLowerCase()) }
                    });
                }

                if (Array.isArray(ids) && ids.length > 0) {
                    must.push({
                        terms: { "id.keyword": ids }
                    });
                }

                const response = await elasticSearch.search({
                    ...defaults.es,
                    body: {
                        query: {
                            // eslint-disable-next-line @typescript-eslint/camelcase
                            constant_score: {
                                filter: {
                                    bool: {
                                        // `must` means `and`;
                                        // all conditions must be satisfied for a record to be present in the result
                                        must: must
                                    }
                                }
                            }
                        },
                        size: limit,
                        sort: { createdOn: "desc" }
                        // sort: [sorters[sort] || sorters.CREATED_ON_ASC]
                    }
                });

                return response?.body?.hits?.hits?.map(item => item._source);
            },

            async create({ category, title, url }) {
                const identity = context.security.getIdentity();
                const createData = new CreateDataModel().populate({ category, title, url });
                await createData.validate();

                const id = KSUID.randomSync().string + "#1";
                const data = {
                    PK: PK_PAGE,
                    SK: id,
                    id,
                    category,
                    title,
                    url,
                    status: "draft",
                    version: 1,
                    type: ITEM_TYPE,
                    createdOn: new Date().toISOString(),
                    createdBy: {
                        id: identity.id,
                        displayName: identity.displayName
                    }
                };

                await db.create({ ...defaults.db, data });

                // Index file in "Elastic Search"
                await elasticSearch.create({
                    ...defaults.es,
                    id: data.SK,
                    body: {
                        id,
                        locale: i18nContent?.locale?.code,
                        // TODO: tenant
                        createdOn: data.createdOn,
                        createdBy: data.createdBy,
                        category: data.category,
                        title: data.title,
                        url: data.url,
                        status: data.status,
                        latest: true,
                        published: false,
                        tags: [],

                    }
                });

                return data;
            },

            async update(id, data) {
                const updateData = new UpdateDataModel().populate(data);
                await updateData.validate();

                data = await updateData.toJSON({ onlyDirty: true });

                await db.update({
                    ...defaults.db,
                    query: { PK: PK_PAGE, SK: id },
                    data
                });

                // Index file in "Elastic Search"
                await elasticSearch.update({
                    ...defaults.es,
                    id,
                    body: {
                        doc: {
                            // TODO: test this, what if the value is `undefined`?
                            tags: data.tags,
                            title: data.title,
                            url: data.url
                        }
                    }
                });
            },

            async publish(id) {
                await db.update({
                    ...defaults.db,
                    query: { PK: PK_PAGE, SK: id },
                    data: {
                        published: true,
                        publishedOn: new Date().toISOString()
                    }
                });

                // Index file in "Elastic Search"
                await elasticSearch.update({
                    ...defaults.es,
                    id,
                    body: {
                        doc: {
                            published: true
                        }
                    }
                });
            },

            async delete(id) {
                await db.delete({
                    ...defaults.db,
                    query: { PK: PK_PAGE, SK: id }
                });

                // Index file in "Elastic Search"
                await elasticSearch.delete({
                    ...defaults.es,
                    id
                });
            }
        };
    }
} as HandlerContextPlugin<HandlerContextDb, HandlerI18NContentContext>;
