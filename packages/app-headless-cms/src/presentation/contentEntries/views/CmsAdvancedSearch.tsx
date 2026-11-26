import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useFeature } from "@webiny/app";
import { AdvancedSearch } from "@webiny/app-aco";
import { useFilterRepository } from "@webiny/app-aco";
import type { FilterDTO } from "@webiny/app-aco/components/AdvancedSearch/domain/index.js";
import { useContentEntryListConfig } from "~/admin/config/contentEntries/index.js";
import { useContentEntriesPresenter } from "~/presentation/contentEntries/list/useContentEntriesPresenter.js";
import { CmsAdvancedSearchFeature } from "~/presentation/contentEntries/advancedSearch/feature.js";

export const CmsAdvancedSearch = observer(() => {
    const presenter = useContentEntriesPresenter();
    const { browser } = useContentEntryListConfig();
    const { presenter: advancedSearch } = useFeature(CmsAdvancedSearchFeature);

    const modelId = presenter.vm.model.modelId;

    useEffect(() => {
        advancedSearch.loadAuthors();
        return () => advancedSearch.clearFilter();
    }, [advancedSearch, modelId]);

    const repository = useFilterRepository(`cms:${modelId}`);

    const onApplyFilter = useCallback(
        (data: FilterDTO | null) => advancedSearch.applyFilter(data),
        [advancedSearch]
    );

    return (
        <AdvancedSearch
            fields={advancedSearch.vm.fields}
            fieldRenderers={browser.advancedSearch.fieldRenderers}
            repository={repository}
            onApplyFilter={onApplyFilter}
        />
    );
});
