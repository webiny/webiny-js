import ApolloClient from "apollo-client";
import get from "lodash/get";
import { getNestingByPath } from "~/utils/getNestingByPath";
import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";
import { GET_CONTENT_MODEL } from "@webiny/app-headless-cms/admin/viewsGraphql";

const FALLBACK_DATA_FIELD = /* GraphQL */ `
    {
        id
    }
`;

const toUpperCase = (modelId: string): string => {
    return upperFirst(camelCase(modelId));
};

export type Filter = {
    filters: {
        path: string;
        condition: string;
        value: string;
    }[];
    filterCondition: string;
};

export type Sort = {
    path: string;
    direction: string;
};

const transformArrayToObject = ({
    fields,
    val,
    condition,
    isDynamicZone
}: {
    fields: (string | undefined)[];
    val: string;
    condition?: string;
    isDynamicZone?: boolean;
}) => {
    const reducer = (
        acc: Record<string, any>,
        item: string | undefined,
        index: number,
        arr: (string | undefined)[]
    ) => {
        const key =
            index + 1 < arr.length ? item : isDynamicZone ? `${item}` : `${item}_${condition}`;

        return { [key || ""]: index + 1 < arr.length ? acc : isDynamicZone ? { [val]: "" } : val };
    };

    return fields?.reduceRight(reducer, {});
};

const transformObjectToQueryString = (data: string) => {
    return data.replace(/:|"|{}|,/gm, "");
};

const composeQueryPaths = async (data: Record<string, any>[], pluralApiName: string) => {
    let queryTemplate = "";
    let queryBodyName = "";

    const getAllPaths = () => {
        return data.map(({ pathPart }) => pathPart);
    };

    const composePathForDynamicZone = () => {
        const paths = getAllPaths();
        const dynamicZonePaths = paths.splice(2);

        return data.reduce((_, currVal: Record<string, any>): string[] => {
            if (currVal?.selectedField?.type === "dynamicZone") {
                queryTemplate = `${pluralApiName}_${toUpperCase(currVal.pathPart)}` || "";
                queryBodyName = `${currVal.selectedField.fieldId}`;
            }

            if (currVal?.selectedTemplate?.gqlTypeName) {
                queryTemplate = `... on ${queryTemplate}_${currVal.selectedTemplate.gqlTypeName}`;
            }

            return [queryBodyName, queryTemplate, ...dynamicZonePaths];
        }, []);
    };

    const concatPathsForQuery = () => {
        const result: string[] = [];

        if (data[0].selectedField?.type === "dynamicZone") {
            result.push(composePathForDynamicZone().join(","));
        } else {
            result.push(getAllPaths().join(","));
        }

        return result;
    };

    return concatPathsForQuery();
};

const transformObjectToString = (data: Record<string, any>) => {
    return JSON.stringify(data).replace(/"([^"]+)":/g, "$1:");
};

const transformArrayToString = (data: string[]) => {
    return JSON.stringify(data).replace(/['"]+/g, "");
};

export const composeDynamicApi = async ({
    readApolloClient,
    modelId,
    paths = [],
    filter,
    sort,
    limit,
    templateWhereField
}: {
    readApolloClient: ApolloClient<any>;
    modelId: string;
    paths: string[] | undefined;
    filter?: Filter;
    sort?: Sort[];
    limit?: number;
    templateWhereField?: Record<string, string | undefined>;
}) => {
    const { data } = await readApolloClient.query({
        query: GET_CONTENT_MODEL,
        variables: { modelId }
    });
    const dataForQueryBuilder = await Promise.all(
        paths.map(async path => await getNestingByPath(readApolloClient, modelId, path))
    );
    const pluralApiName = get(data, "getContentModel.data.pluralApiName");
    const getDataForQueryBuilder = await Promise.all(
        dataForQueryBuilder.map(async element => await composeQueryPaths(element, pluralApiName))
    );
    const filterCondition =
        filter?.filterCondition !== undefined
            ? filter?.filterCondition === "matchAny"
                ? "OR"
                : "AND"
            : "";

    const buildQueryBody = () => {
        const paths = getDataForQueryBuilder.flat();
        const body: Record<string, any> = {};

        for (let i = 0; i < paths.length; i++) {
            const keys = paths[i].split(",");
            let tempObj = body;

            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                if (/\w+/.test(key)) {
                    tempObj[key] = tempObj[key] || {};
                    tempObj = tempObj[key];
                }
            }
        }

        return transformObjectToQueryString(JSON.stringify(body, null, 4));
    };

    const getPathParts = async (filter: string) => {
        const data = await getNestingByPath(readApolloClient, modelId, filter);
        const paths = data.map(({ pathPart }) => pathPart);

        return paths;
    };

    const transformFiltersPaths =
        filter?.filters?.map(async ({ path, condition, value }) => ({
            path: await getPathParts(path),
            condition,
            value
        })) || [];

    const transformedFiltersPaths = await Promise.all(transformFiltersPaths);

    const transformSortRulers = sort?.map(({ path, direction }) => `${path}_${direction}`) || [];

    const where = {
        [filterCondition]: transformedFiltersPaths.map(({ path, condition, value }) =>
            transformArrayToObject({
                fields: path,
                val: value,
                condition,
                isDynamicZone: false
            })
        )
    };

    const params = {
        where: templateWhereField
            ? templateWhereField
            : filter?.filterCondition !== undefined
            ? where
            : {},
        sort: transformSortRulers,
        limit: limit || 50
    };

    const QUERY_API_NAME = `list${pluralApiName}`;

    const DATA_FIELD = buildQueryBody() || FALLBACK_DATA_FIELD;

    const query = `
        {
            result: ${QUERY_API_NAME}(
                where: ${transformObjectToString(params.where)},
                sort: ${transformArrayToString(params.sort)},
                limit: ${params.limit}
            ) {
                data ${DATA_FIELD}

                error {
                    message
                    code
                    data
                }
            }
        }
    `;

    return query;
};
