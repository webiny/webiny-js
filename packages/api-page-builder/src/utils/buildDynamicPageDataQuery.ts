import upperFirst from "lodash/upperFirst";
import camelCase from "lodash/camelCase";

import {
    CmsModel,
    CmsModelField,
    CmsModelDynamicZoneField,
    CmsDynamicZoneTemplate,
    CmsContext
} from "@webiny/api-headless-cms/types";

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

const transformFiltersArrayToObject = ({
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

// Remove object symbols. Replace "#" with ":" for dynamic zones.
const transformObjectToQueryString = (data: string) => {
    return data.replace(/:|"|{}|,/gm, "").replace(/#/gm, ":");
};

const transformObjectToString = (data: Record<string, any>) => {
    return JSON.stringify(data).replace(/"([^"]+)":/g, "$1:");
};

const transformArrayToString = (data: string[]) => {
    return JSON.stringify(data).replace(/['"]+/g, "");
};

type NestingItem = {
    modelSingularApiName?: string;
    fields?: CmsModelField[];
    selectedField?: CmsModelField;
    templates?: CmsDynamicZoneTemplate[];
    selectedTemplate?: CmsDynamicZoneTemplate;
    pathPart?: string;
};

// Creates array of data needed to build query.
const getNestingByPath = async (context: CmsContext, path: string, model: CmsModel) => {
    const nesting: NestingItem[] = [
        {
            modelSingularApiName: model.singularApiName,
            fields: model.fields
        }
    ];

    if (!path) {
        return nesting;
    }

    for (const pathPart of path.split(".")) {
        if (nesting[nesting.length - 1]?.templates) {
            const currentTemplate = nesting[nesting.length - 1]?.templates?.find(
                (template: CmsDynamicZoneTemplate) => template.gqlTypeName === pathPart
            );

            if (!currentTemplate) {
                throw Error(
                    `${
                        nesting[nesting.length - 1].modelSingularApiName
                    } has no template with gqlTypeName ${pathPart}`
                );
            }

            nesting[nesting.length - 1].selectedTemplate = currentTemplate;
            nesting[nesting.length - 1].pathPart = pathPart;

            const nestedFields =
                (
                    nesting[nesting.length - 2].selectedField as CmsModelDynamicZoneField
                )?.settings?.templates?.find(
                    template => template.gqlTypeName === currentTemplate.gqlTypeName
                )?.fields || [];

            nesting.push({
                modelSingularApiName: nesting[nesting.length - 1].modelSingularApiName,
                fields: nestedFields
            });
        } else {
            const currentField = nesting[nesting.length - 1]?.fields?.find(
                (field: CmsModelField) => field.fieldId === pathPart
            );

            if (!currentField) {
                throw Error(
                    `${
                        nesting[nesting.length - 1].modelSingularApiName
                    } has no field with id ${pathPart}`
                );
            }

            nesting[nesting.length - 1].selectedField = currentField;
            nesting[nesting.length - 1].pathPart = pathPart;

            if (currentField.type === "dynamicZone") {
                nesting.push({
                    modelSingularApiName: nesting[nesting.length - 1].modelSingularApiName,
                    templates: currentField.settings?.templates
                });
            } else if (currentField.type === "object") {
                const nestedFields = currentField.settings?.fields || [];

                nesting.push({
                    modelSingularApiName: nesting[nesting.length - 1].modelSingularApiName,
                    fields: nestedFields
                });
            } else if (currentField.type === "ref") {
                const modelId = currentField.settings?.models?.[0]?.modelId;

                if (modelId) {
                    const data = await context.cms.getModel(modelId);
                    const nestedFields = data?.fields || [];

                    nesting.push({
                        modelSingularApiName: data?.singularApiName,
                        fields: nestedFields
                    });
                }
            }
        }
    }

    return nesting;
};

const resolveQueryPaths = (data: NestingItem[]) => {
    const paths: string[] = [];
    let dynamicZonePathPart = "";
    let dynamicZoneFragmentPrefix = "";

    data.forEach((nestingItem: NestingItem) => {
        if (nestingItem.selectedField?.type === "dynamicZone" && nestingItem.pathPart) {
            dynamicZoneFragmentPrefix = `${nestingItem.modelSingularApiName}_${toUpperCase(
                nestingItem.pathPart
            )}`;
            dynamicZonePathPart = nestingItem.pathPart;
        } else if (nestingItem.selectedTemplate) {
            // For dynamic zones we need to save selected template's gqlTypeName to pick correct template
            // on the client side. "#" symbol is used temporary to not be deleted by transformObjectToQueryString
            // function. Final query string will be "dynamicZone_Template1:dynamicZone", which will result in
            // "dynamicZone_Template1: { ... }" response.
            paths.push(
                `${dynamicZonePathPart}_${nestingItem.selectedTemplate.gqlTypeName}#${dynamicZonePathPart}`
            );
            // We also need to add this fragment to query to resolve dynamic zone template's fields.
            paths.push(
                `... on ${dynamicZoneFragmentPrefix}_${nestingItem.selectedTemplate.gqlTypeName}`
            );
        } else if (nestingItem.pathPart) {
            paths.push(nestingItem.pathPart);
        }
    });

    return paths;
};

export const buildDynamicPageDataQuery = async ({
    context,
    model,
    paths = [],
    filter,
    sort,
    limit,
    additionalWhere
}: {
    context: CmsContext;
    model: CmsModel;
    paths: string[] | undefined;
    filter?: Filter;
    sort?: Sort[];
    limit?: number;
    additionalWhere?: Record<string, string | undefined>;
}) => {
    // Get nesting by path to resolve path parts for dynamic zones.
    const nesting = await Promise.all(
        paths.map(async path => await getNestingByPath(context, path, model))
    );
    // Resolve path parts for dynamic zones.
    const queryPaths = await Promise.all(nesting.map(async element => resolveQueryPaths(element)));
    const filterCondition =
        filter?.filterCondition !== undefined
            ? filter?.filterCondition === "matchAny"
                ? "OR"
                : "AND"
            : "";

    const buildQueryBody = async () => {
        const body: Record<string, any> = {};

        for (let i = 0; i < queryPaths.length; i++) {
            const keys = queryPaths[i];
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

    // Convert sort rules to query syntax.
    const transformSortRulers = sort?.map(({ path, direction }) => `${path}_${direction}`) || [];

    // Convert filters to query syntax.
    const where = {
        [filterCondition]: filter?.filters?.map(({ path, condition, value }) =>
            transformFiltersArrayToObject({
                fields: path.split("."),
                val: value,
                condition,
                isDynamicZone: false
            })
        )
    };

    const params = {
        where: additionalWhere
            ? additionalWhere
            : filter?.filterCondition !== undefined
            ? where
            : {},
        sort: transformSortRulers,
        limit: limit || 50
    };

    const QUERY_API_NAME = `list${model.pluralApiName}`;

    const DATA_FIELD = (await buildQueryBody()) || FALLBACK_DATA_FIELD;

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
