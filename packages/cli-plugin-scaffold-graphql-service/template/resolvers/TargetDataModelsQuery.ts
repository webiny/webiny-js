import { TargetDataModelEntity } from "../types";
import { TargetDataModel } from "../entities";
import TargetDataModelsResolver from "./TargetDataModelsResolver";

/**
 * Contains base `getTargetDataModel` and `listTargetDataModels` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement security-related checks.
 * https://www.webiny.com/docs/how-to-guides/scaffolding/extend-graphql-api#essential-files
 */

interface GetTargetDataModelParams {
    id: string;
}

interface ListTargetDataModelsParams {
    sort?: "createdOn_ASC" | "createdOn_DESC";
    limit?: number;
    after?: string;
    before?: string;
}

interface ListTargetDataModelsResponse {
    data: TargetDataModelEntity[];
    meta: { limit: number; after: string | null; before: string | null };
}

interface TargetDataModelsQuery {
    getTargetDataModel(params: GetTargetDataModelParams): Promise<TargetDataModelEntity>;
    listTargetDataModels(params: ListTargetDataModelsParams): Promise<ListTargetDataModelsResponse>;
}

interface TargetDataModelsQueryParams {
    limit?: number;
    reverse?: boolean;
    gt?: string | number;
    lt?: string | number;
}

interface TargetDataModelsMetaParams {
    limit: number;
    after: string | null;
    before: string | null;
}

/**
 * To define our GraphQL resolvers, we are using the "class method resolvers" approach.
 * https://www.graphql-tools.com/docs/resolvers#class-method-resolvers
 */
export default class TargetDataModelsQueryImplementation
    extends TargetDataModelsResolver
    implements TargetDataModelsQuery
{
    /**
     * Returns a single TargetDataModel entry from the database.
     * @param id
     */
    async getTargetDataModel({ id }: GetTargetDataModelParams) {
        // Query the database and return the entry. If entry was not found, an error is thrown.
        const { Item: targetDataModel } = await TargetDataModel.get({ PK: this.getPK(), SK: id });
        if (!targetDataModel) {
            throw new Error(`TargetDataModel "${id}" not found.`);
        }

        return targetDataModel;
    }

    /**
     * List multiple TargetDataModel entries from the database.
     * Supports basic sorting and cursor-based pagination.
     * @param limit
     * @param sort
     * @param after
     * @param before
     */
    async listTargetDataModels({ limit = 10, sort, after, before }: ListTargetDataModelsParams) {
        const PK = this.getPK();
        const query: TargetDataModelsQueryParams = {
            limit,
            reverse: sort !== "createdOn_ASC",
            gt: undefined,
            lt: undefined
        };
        const meta: TargetDataModelsMetaParams = { limit, after: null, before: null };

        // The query is constructed differently, depending on the "before" or "after" values.
        if (before) {
            query.reverse = !query.reverse;
            if (query.reverse) {
                query.lt = before;
            } else {
                query.gt = before;
            }

            const { Items } = await TargetDataModel.query(PK, { ...query, limit: limit + 1 });

            const data = Items.slice(0, limit).reverse();

            const hasBefore = Items.length > limit;
            if (hasBefore) {
                meta.before = Items[Items.length - 1].id;
            }

            meta.after = Items[0].id;

            return { data, meta };
        }

        if (after) {
            if (query.reverse) {
                query.lt = after;
            } else {
                query.gt = after;
            }
        }

        const { Items } = await TargetDataModel.query(PK, { ...query, limit: limit + 1 });

        const data = Items.slice(0, limit);

        const hasAfter = Items.length > limit;
        if (hasAfter) {
            meta.after = Items[limit - 1].id;
        }

        if (after) {
            meta.before = Items[0].id;
        }

        return { data, meta };
    }
}
