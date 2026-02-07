import type {
    CmsSdkConfig,
    GetEntryParams,
    ListEntriesParams,
    CreateEntryParams,
    UpdateEntryParams,
    DeleteEntryParams,
    PublishEntryParams,
    UnpublishEntryParams,
    CmsEntry,
    ListEntriesResult
} from "./types.js";

export class CmsSdk {
    private config: CmsSdkConfig;
    private fetchFn: typeof fetch;

    constructor(config: CmsSdkConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    private async executeGraphQL(query: string, variables: Record<string, any> = {}) {
        const url = `${this.config.apiHost}/graphql`;

        const response = await this.fetchFn(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.config.apiToken}`,
                "x-tenant": this.config.apiTenant
            },
            body: JSON.stringify({ query, variables })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0]?.message || "GraphQL error");
        }

        return result.data;
    }

    async getEntry(params: GetEntryParams): Promise<CmsEntry | null> {
        const { modelId, where, fields = [] } = params;

        const fieldsSelection = fields.length > 0 ? fields.join("\n") : "id\nentryId";

        const query = `
            query GetEntry($modelId: String!, $where: JSON!) {
                cms {
                    getEntry(modelId: $modelId, where: $where) {
                        data {
                            ${fieldsSelection}
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, { modelId, where });

        if (data.cms.getEntry.error) {
            throw new Error(data.cms.getEntry.error.message);
        }

        return data.cms.getEntry.data;
    }

    async listEntries(params: ListEntriesParams): Promise<ListEntriesResult> {
        const {
            modelId,
            where,
            sort,
            limit = 10,
            after,
            include,
            exclude,
            excludeType
        } = params;

        const query = `
            query ListEntries(
                $modelId: String!
                $where: JSON
                $sort: JSON
                $limit: Int
                $after: String
                $include: [String!]
                $exclude: [String!]
                $excludeType: [String!]
            ) {
                cms {
                    listEntries(
                        modelId: $modelId
                        where: $where
                        sort: $sort
                        limit: $limit
                        after: $after
                        include: $include
                        exclude: $exclude
                        excludeType: $excludeType
                    ) {
                        data {
                            id
                            entryId
                        }
                        meta {
                            cursor
                            hasMoreItems
                            totalCount
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, {
            modelId,
            where,
            sort,
            limit,
            after,
            include,
            exclude,
            excludeType
        });

        if (data.cms.listEntries.error) {
            throw new Error(data.cms.listEntries.error.message);
        }

        return {
            items: data.cms.listEntries.data,
            meta: data.cms.listEntries.meta
        };
    }

    async createEntry(params: CreateEntryParams): Promise<CmsEntry> {
        const { modelId, values } = params;

        const query = `
            mutation CreateEntry($modelId: String!, $values: JSON!) {
                cms {
                    createEntry(modelId: $modelId, values: $values) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, { modelId, values });

        if (data.cms.createEntry.error) {
            throw new Error(data.cms.createEntry.error.message);
        }

        return data.cms.createEntry.data;
    }

    async updateEntry(params: UpdateEntryParams): Promise<CmsEntry> {
        const { modelId, id, values } = params;

        const query = `
            mutation UpdateEntry($modelId: String!, $id: ID!, $values: JSON!) {
                cms {
                    updateEntry(modelId: $modelId, id: $id, values: $values) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, { modelId, id, values });

        if (data.cms.updateEntry.error) {
            throw new Error(data.cms.updateEntry.error.message);
        }

        return data.cms.updateEntry.data;
    }

    async deleteEntry(params: DeleteEntryParams): Promise<boolean> {
        const { modelId, id, permanent = false } = params;

        const query = `
            mutation DeleteEntry($modelId: String!, $id: ID!, $permanent: Boolean) {
                cms {
                    deleteEntry(modelId: $modelId, id: $id, permanent: $permanent) {
                        data
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, { modelId, id, permanent });

        if (data.cms.deleteEntry.error) {
            throw new Error(data.cms.deleteEntry.error.message);
        }

        return data.cms.deleteEntry.data;
    }

    async publishEntry(params: PublishEntryParams): Promise<CmsEntry> {
        const { modelId, id } = params;

        const query = `
            mutation PublishEntry($modelId: String!, $id: ID!) {
                cms {
                    publishEntry(modelId: $modelId, id: $id) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, { modelId, id });

        if (data.cms.publishEntry.error) {
            throw new Error(data.cms.publishEntry.error.message);
        }

        return data.cms.publishEntry.data;
    }

    async unpublishEntry(params: UnpublishEntryParams): Promise<CmsEntry> {
        const { modelId, id } = params;

        const query = `
            mutation UnpublishEntry($modelId: String!, $id: ID!) {
                cms {
                    unpublishEntry(modelId: $modelId, id: $id) {
                        data {
                            id
                            entryId
                        }
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        const data = await this.executeGraphQL(query, { modelId, id });

        if (data.cms.unpublishEntry.error) {
            throw new Error(data.cms.unpublishEntry.error.message);
        }

        return data.cms.unpublishEntry.data;
    }
}
