import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useApolloClient } from "@apollo/react-hooks";

import {
    FieldRaw,
    FiltersGraphQLGateway,
    QueryObjectRepository
} from "~/components/AdvancedSearch/QueryObject";
import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";
import { advancedSearchRepository } from "./AdvancedSearchRepository";

import { Button } from "./Button";
import { QueryManagerDialog } from "./QueryManagerDialog";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer";
import { QuerySaverDialog } from "./QuerySaverDialog";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onSubmit: (data: any) => void;
}

export const AdvancedSearch = observer(({ fields, modelId, onSubmit }: AdvancedSearchProps) => {
    const client = useApolloClient();

    const [queryObjectRepository] = useState(
        QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
    );
    const [presenter] = useState<AdvancedSearchPresenter>(
        new AdvancedSearchPresenter(advancedSearchRepository, onSubmit)
    );

    const viewModel = presenter.getViewModel();

    return (
        <>
            <Button onClick={() => presenter.openManager()} />
            <QueryManagerDialog
                onClose={presenter.closeManager}
                onCreate={presenter.onManagerCreateFilter}
                onEdit={presenter.onManagerEditFilter}
                onSelect={presenter.onManagerSelectFilter}
                open={viewModel.showManager}
                repository={queryObjectRepository}
            />
            <QueryBuilderDrawer
                fields={fields}
                modelId={modelId}
                onClose={presenter.closeBuilder}
                onPersist={presenter.onBuilderPersist}
                onSubmit={presenter.onBuilderSubmit}
                open={viewModel.showBuilder}
                queryObject={viewModel.queryObject}
            />
            <QuerySaverDialog
                mode={viewModel.mode}
                onSubmit={presenter.onSaverSubmit}
                onClose={presenter.closeSaver}
                open={viewModel.showSaver}
                queryObject={viewModel.queryObject}
                repository={queryObjectRepository}
            />
        </>
    );
});
