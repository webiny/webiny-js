import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { AdvancedSearch, GraphQLInputMapper, useFilterRepository } from "@webiny/app-aco";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { FieldsMapper } from "~/admin/components/ContentEntries/Filters/FieldsMapper.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";

const SYSTEM_FIELD_PREFIXES = ["status", "createdOn", "savedOn", "AND", "OR"];

function isSystemKey(key: string): boolean {
    return SYSTEM_FIELD_PREFIXES.some(prefix => key === prefix || key.startsWith(`${prefix}_`));
}

function wrapUserFields(where: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const values: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(where)) {
        if (key === "AND" || key === "OR") {
            result[key] = (value as Record<string, unknown>[]).map(item => wrapUserFields(item));
        } else if (isSystemKey(key)) {
            result[key] = value;
        } else {
            values[key] = value;
        }
    }

    if (Object.keys(values).length > 0) {
        result["values"] = values;
    }

    return result;
}

export const CmsAdvancedSearch = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { browser } = useContentEntryListConfig();
    const model = presenter.vm.model;
    const fields = useMemo(() => FieldsMapper.toRaw(model), [model]);
    const repository = useFilterRepository(`cms:${model.modelId}`);

    const onApplyFilter = useCallback(
        (data: FilterDTO | null) => {
            if (!data || !Object.keys(data).length) {
                presenter.list.actions.filter.clearAll();
                return;
            }

            const where = wrapUserFields(GraphQLInputMapper.toGraphQL(data));
            for (const [key, value] of Object.entries(where)) {
                presenter.list.actions.filter.set(key, value);
            }
        },
        [presenter]
    );

    return (
        <AdvancedSearch
            fields={fields}
            fieldRenderers={browser.advancedSearch.fieldRenderers}
            repository={repository}
            onApplyFilter={onApplyFilter}
        />
    );
});
