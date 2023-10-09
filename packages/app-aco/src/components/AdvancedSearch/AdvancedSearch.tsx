import React, { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { FieldRaw, FiltersGraphQLGateway, QueryObjectRepository } from "./QueryObject";
import { AdvancedSearchPresenter, AdvancedSearchViewModel } from "./AdvancedSearchPresenter";

import { Button } from "./Button";
import { QueryManagerDialog } from "./QueryManagerDialog";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer";
import { QuerySaverDialog } from "./QuerySaverDialog";
import { SelectedFilter } from "./SelectedFilter";

import { AdvancedSearchContainer } from "./AdvancedSearch.styled";
import { observer } from "mobx-react-lite";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onSubmit: (data: any) => void;
}

export const AdvancedSearch = observer(({ fields, modelId, onSubmit }: AdvancedSearchProps) => {
    const client = useApolloClient();

    const [repository] = useState(
        QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
    );
    const [presenter] = useState<AdvancedSearchPresenter>(
        new AdvancedSearchPresenter(repository, onSubmit)
    );

    const [viewModel, setViewModel] = useState<AdvancedSearchViewModel | undefined>();

    useEffect(() => {
        presenter.load(setViewModel);
    }, []);

    if (!viewModel) {
        return null;
    }

    return (
        <>
            <AdvancedSearchContainer>
                <Button onClick={() => presenter.openManager()} />
                <SelectedFilter
                    show={viewModel.showSelected}
                    filter={viewModel.queryObject}
                    onEdit={filter => presenter.editFilter(filter)}
                    onRemove={() => presenter.removeFilter()}
                />
            </AdvancedSearchContainer>
            <QueryManagerDialog
                onClose={() => presenter.closeManager()}
                onCreate={() => presenter.createFilter()}
                onEdit={filter => presenter.editFilter(filter)}
                onSelect={filter => presenter.applyFilter(filter)}
                open={viewModel.showManager}
                repository={repository}
            />
            <QueryBuilderDrawer
                fields={fields}
                modelId={modelId}
                onClose={() => presenter.closeBuilder()}
                onPersist={filter => presenter.persistFilter(filter)}
                onSubmit={filter => presenter.applyFilter(filter)}
                open={viewModel.showBuilder}
                queryObject={viewModel.queryObject}
            />
            <QuerySaverDialog
                mode={viewModel.mode}
                onSubmit={filter => presenter.saveFilter(filter)}
                onClose={() => presenter.closeSaver()}
                open={viewModel.showSaver}
                queryObject={viewModel.queryObject}
                repository={repository}
            />
        </>
    );
});
