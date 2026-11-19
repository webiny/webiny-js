import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { AdvancedSearch, GraphQLInputMapper, useFilterRepository } from "@webiny/app-aco";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { ListEntryAuthorsFeature } from "~/features/listEntryAuthors/feature.js";
import type { EntryAuthor } from "~/features/listEntryAuthors/abstractions.js";
import { FieldsMapper } from "./FieldsMapper.js";

const SYSTEM_FIELD_PREFIXES = ["status", "createdOn", "savedOn", "createdBy", "AND", "OR"];

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
    const { useCase: listAuthors } = useFeature(ListEntryAuthorsFeature);
    const [authors, setAuthors] = useState<EntryAuthor[]>([]);

    useEffect(() => {
        // Users without permission to list users get no Author filter rather than an error.
        listAuthors
            .execute()
            .then(setAuthors)
            .catch(() => setAuthors([]));
    }, [listAuthors]);

    const model = presenter.vm.model;
    const fields = useMemo(() => FieldsMapper.toRaw(model, authors), [model, authors]);
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
