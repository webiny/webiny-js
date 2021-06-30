import { queryOptions as DynamoDBToolboxQueryOptions } from "dynamodb-toolbox/dist/classes/Table";
import WebinyError from "@webiny/error";
import { Entity } from "dynamodb-toolbox";

export interface QueryParams {
    entity: Entity<any>;
    previous: any;
    partitionKey: string;
    options?: DynamoDBToolboxQueryOptions;
}

export interface QueryResult<T> {
    result: any | null;
    items: T[];
}

/**
 * Will run query only once. Pass the previous to run the query again to fetch new data.
 * It returns the result and the items it found.
 * Result is required to fetch the items that were not fetched in the previous run.
 */
export const query = async <T>(params: QueryParams): Promise<QueryResult<T>> => {
    const { entity, previous, partitionKey, options } = params;
    let result;
    /**
     * In case there is no previous result we must make a new query.
     * This is the first query on the given partition key.
     */
    if (!previous) {
        result = await entity.query(partitionKey, options);
    } else if (typeof previous.next === "function") {
        /**
         * In case we have a previous result and it has a next method, we run it.
         * In case result of the next method is false, it means it has nothing else to read
         * and we return a null to keep the query from repeating.
         */
        if (typeof previous.next !== "function") {
            return {
                result: null,
                items: []
            };
        }
        result = await previous.next();
        if (result === false) {
            return {
                result: null,
                items: []
            };
        }
    } else {
        /**
         * This could probably never happen but keep it here just in case to break the query loop.
         * Basically, either previous does not exist or it exists and has a next method
         * and at that point a result returned will be null and loop should not start again.
         */
        return {
            result: null,
            items: []
        };
    }
    /**
     * We expect the result to contain an Items array and if not, something went wrong, very wrong.
     */
    if (!result || !result.Items || !Array.isArray(result.Items)) {
        throw new WebinyError(
            "Error when querying for content entries - no result.",
            "QUERY_ERROR",
            {
                partitionKey,
                options
            }
        );
    }
    return {
        result,
        items: result.Items
    };
};
/**
 * Will run the query to fetch the results no matter how much iterations it needs to go through.
 */
export const queryAll = async <T>(params: Omit<QueryParams, "previous">): Promise<T[]> => {
    const items: T[] = [];
    let results: QueryResult<T>;
    let previousResult: any;
    while ((results = await query({ ...params, previous: previousResult }))) {
        items.push(...results.items);
        if (!results.result) {
            return items;
        }
        previousResult = results.result;
    }
    return items;
};
