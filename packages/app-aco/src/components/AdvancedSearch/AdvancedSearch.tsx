import React, { useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";
import { observer } from "mobx-react-lite";

import {
    FieldRaw,
    FiltersGraphQLGateway,
    QueryObjectDTO,
    QueryObjectRepository
} from "./QueryObject";
import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";

import { Button } from "./Button";
import { QueryManagerDialog } from "./QueryManagerDialog";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer";
import { QuerySaverDialog } from "./QuerySaverDialog";
import { SelectedFilter } from "./SelectedFilter";

import { AdvancedSearchContainer } from "./AdvancedSearch.styled";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onSubmit: (data: QueryObjectDTO | null) => void;
}

export const AdvancedSearch = observer(({ fields, modelId, onSubmit }: AdvancedSearchProps) => {
    const client = useApolloClient();

    const [repository] = useState(
        QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
    );
    const [presenter] = useState<AdvancedSearchPresenter>(
        new AdvancedSearchPresenter(repository, onSubmit)
    );

    if (!presenter.vm) {
        return null;
    }

    return (
        <>
            <AdvancedSearchContainer>
                <Button onClick={() => presenter.openManager()} />
                <SelectedFilter
                    show={presenter.vm.showSelected}
                    filter={presenter.vm.queryObject}
                    onEdit={filter => presenter.editFilter(filter.id)}
                    onRemove={() => presenter.removeFilter()}
                />
            </AdvancedSearchContainer>
            <QueryManagerDialog
                onClose={() => presenter.closeManager()}
                onCreate={() => presenter.createFilter()}
                onEdit={filter => presenter.editFilter(filter.id)}
                onSelect={filter => presenter.applyFilter(filter.id)}
                open={presenter.vm.showManager}
                repository={repository}
            />
            <QueryBuilderDrawer
                fields={fields}
                modelId={modelId}
                onClose={() => presenter.closeBuilder()}
                onPersist={filter => presenter.persistFilter(filter.id)}
                onSubmit={filter => presenter.applyFilter(filter.id)}
                open={presenter.vm.showBuilder}
                queryObject={presenter.vm.queryObject}
            />
            <QuerySaverDialog
                mode={presenter.vm.mode}
                onSubmit={filter => presenter.saveFilter(filter.id)}
                onClose={() => presenter.closeSaver()}
                open={presenter.vm.showSaver}
                queryObject={presenter.vm.queryObject}
                repository={repository}
            />
        </>
    );
});
