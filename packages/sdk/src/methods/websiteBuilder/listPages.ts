import { Result } from "../../Result.js";
import { createMethod } from "../../utils/createMethod.js";
import { buildFieldsSelection } from "../fileManager/buildFieldsSelection.js";
import { listPagesSchema } from "./schemas.js";
import { executeWbOperation } from "./executeWbOperation.js";
import type {
    WbListMeta,
    WbPage,
    WbPageListSorter,
    WbPagesListWhere
} from "./websiteBuilderTypes.js";

export interface ListPagesParams {
    /** `WbPagesListWhereInput`, e.g. `{ latest: true, location: { folderId: "…" } }`. */
    where?: WbPagesListWhere;
    limit?: number;
    after?: string;
    sort?: WbPageListSorter[];
    search?: string;
    fields: string[];
}

export interface ListPagesResult {
    data: WbPage[];
    meta: WbListMeta;
}

export const listPages = createMethod(listPagesSchema, async (config, fetchFn, params) => {
    const { where, limit, after, sort, search, fields } = params as ListPagesParams;
    const result = await executeWbOperation<WbPage[]>(config, fetchFn, {
        type: "query",
        operation: "listPages",
        variableDefinitions:
            "$where: WbPagesListWhereInput, $limit: Int, $after: String, $sort: [WbPageListSorter], $search: String",
        args: "where: $where, limit: $limit, after: $after, sort: $sort, search: $search",
        selection: buildFieldsSelection(fields),
        withMeta: true,
        variables: { where, limit, after, sort, search },
        fields
    });
    if (result.isFail()) {
        return Result.fail(result.error);
    }
    return Result.ok<ListPagesResult>({
        data: result.value.data ?? [],
        meta: result.value.meta as WbListMeta
    });
});
