import { CmsContext, CmsContentModelType } from "@webiny/api-headless-cms/types";
import { WhereCondition } from "./parseWhere";
import { Sorter } from "./parseSort";

interface CreateFindParameters {
    model: CmsContentModelType;
    where: WhereCondition[];
    sort?: Sorter[];
    context: CmsContext;
}

export const createFindParameters = ({
    model,
    where,
    sort = []
}: CreateFindParameters): { [key: string]: any } => {
    // Sort conditions alphabetically
    where = where.sort((a, b) => a.fieldId.localeCompare(b.fieldId));

    // Get a list of unique fields
    const allFields = [
        ...new Set([...where.map(w => w.fieldId), ...sort.map(s => s.fieldId)])
    ].sort();

    function createCondition({ fieldId, operator, value }: WhereCondition) {
        // TODO: generate condition based on operator and fieldId
    }

    const conditions: Record<string, any> = where
        .map(filter => createCondition(filter))
        .filter(Boolean);

    const sorters = sort.reduce((acc, item) => {
        const sortField = `v${allFields.indexOf(item.fieldId)}`;
        acc[sortField] = item.direction;
        return acc;
    }, {});

    // Make sure the field being sorted has a non-null value
    Object.keys(sorters).forEach(key => {
        conditions.push({ [key]: { $ne: null } });
    });

    if (!allFields.length) {
        return { query: { fields: "id", model: model.modelId }, sort: {} };
    }

    return {
        query: {
            model: model.modelId,
            fields: allFields.join(","),
            $and: conditions
        },
        sort: sorters
    };
};
