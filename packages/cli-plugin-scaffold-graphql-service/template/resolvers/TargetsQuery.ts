import { TargetsContext, TargetEntity } from "../types";
import { Targets } from "../entities";
import { PK } from "../utils";

/**
 * Contains base `getTarget` and `listTargets` GraphQL resolver functions.
 * Feel free to adjust the code to your needs. Also, note that at some point in time, you will
 * most probably want to implement security-related checks.
 * https://www.webiny.com/docs/tutorials
 */

interface GetTargetParams {
    id: string;
}

interface ListTargetsParams {
    sort?: { savedOn?: "asc" | "desc" };
    limit?: number;
    after?: string;
}

interface ListTargetsResponse {
    data: TargetEntity[];
    meta: { limit: number; cursor: string };
}

interface TargetsQuery {
    getTarget(params: GetTargetParams): Promise<TargetEntity>;
    listTargets(params: ListTargetsParams): Promise<ListTargetsResponse>;
}

/**
 * To define our GraphQL resolvers, we are using the "class method resolvers" approach.
 * https://www.graphql-tools.com/docs/resolvers#class-method-resolvers
 */
export default class TargetsQueryResolver implements TargetsQuery {
    private readonly context: TargetsContext;

    constructor(context: TargetsContext) {
        this.context = context;
    }

    /**
     * Returns a single Target entry from the database.
     * @param id
     */
    async getTarget({ id }: GetTargetParams) {
        // Query the database and return the entry. If entry was not found, an error is thrown.
        const { Item: target } = await Targets.get({ PK, SK: id });
        if (!target) {
            throw new Error(`Target "${id}" not found.`);
        }

        return target;
    }


    /**
     * List multiple Target entries from the database.
     * Supports basic sorting and cursor-based pagination.
     * @param limit
     * @param sort
     * @param after
     */
    async listTargets({ limit, sort = {}, after }: ListTargetsParams) {
        // Let's create the query object. By default, we apply a limit of 10 entries per page and return entries
        // sorted by their time of creation, in a descending order. For this, we rely on the "SK" database column,
        // which contains a sequential MongoDB ID. Check "./TargetsMutations.ts" to see how storing is performed.
        const query = {
            limit: limit || 10,
            reverse: sort.savedOn !== "asc",
            gt: undefined,
            lt: undefined
        };

        // If `after` (cursor string) is specified, we have to apply a lower-than or greater-than query filter.
        if (after) {
            if (query.reverse) {
                query.lt = after;
            } else {
                query.gt = after;
            }
        }

        // Finally, query the database and return the results, along with some meta-data.
        const { Items: data } = await Targets.query(PK, query);

        const cursor = data.length === query.limit ? data[data.length - 1].id : null;
        const meta = {
            limit: query.limit,
            cursor
        };

        return { meta, data };
    }
}
