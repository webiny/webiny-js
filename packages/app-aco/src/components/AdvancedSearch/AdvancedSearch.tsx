import React, { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

import { FieldRaw, FiltersGraphQLGateway, QueryObjectRepository } from "./QueryObject";
import { AdvancedSearchPresenter, AdvancedSearchViewModel } from "./AdvancedSearchPresenter";
import { advancedSearchRepository } from "./AdvancedSearchRepository";

import { Button } from "./Button";
import { QueryManagerDialog } from "./QueryManagerDialog";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer";
import { QuerySaverDialog } from "./QuerySaverDialog";
import { SelectedFilter } from "./SelectedFilter";

import { AdvancedSearchContainer } from "./AdvancedSearch.styled";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onSubmit: (data: any) => void;
}

export const AdvancedSearch = ({ fields, modelId, onSubmit }: AdvancedSearchProps) => {
    const client = useApolloClient();

    const [queryObjectRepository] = useState(
        QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
    );
    const [presenter] = useState<AdvancedSearchPresenter>(
        new AdvancedSearchPresenter(advancedSearchRepository, onSubmit)
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
                    show={viewModel.showChip}
                    queryObject={viewModel.queryObject}
                    onEdit={() => presenter.onChipEdit()}
                    onDelete={() => presenter.onChipDelete()}
                />
            </AdvancedSearchContainer>
            <QueryManagerDialog
                onClose={() => presenter.closeManager()}
                onCreate={() => presenter.onManagerCreateFilter()}
                onEdit={filter => presenter.onManagerEditFilter(filter)}
                onSelect={filter => presenter.onManagerSelectFilter(filter)}
                open={viewModel.showManager}
                repository={queryObjectRepository}
            />
            <QueryBuilderDrawer
                fields={fields}
                modelId={modelId}
                onClose={() => presenter.closeBuilder()}
                onPersist={filter => presenter.onBuilderPersist(filter)}
                onSubmit={filter => presenter.onBuilderSubmit(filter)}
                open={viewModel.showBuilder}
                queryObject={viewModel.queryObject}
            />
            <QuerySaverDialog
                mode={viewModel.mode}
                onSubmit={filter => presenter.onSaverSubmit(filter)}
                onClose={() => presenter.closeSaver()}
                open={viewModel.showSaver}
                queryObject={viewModel.queryObject}
                repository={queryObjectRepository}
            />
        </>
    );
};
