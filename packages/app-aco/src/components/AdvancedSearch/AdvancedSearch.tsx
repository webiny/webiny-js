import React, { useEffect, useState } from "react";
import { useApolloClient } from "@apollo/react-hooks";

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
import { observer } from "mobx-react-lite";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onApplyFilter: (data: QueryObjectDTO) => void;
}

export const AdvancedSearch = observer(
    ({ fields, modelId, onApplyFilter }: AdvancedSearchProps) => {
        const client = useApolloClient();

        const [queryObjectRepository] = useState(
            QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
        );
        const [presenter] = useState<AdvancedSearchPresenter>(
            new AdvancedSearchPresenter(queryObjectRepository)
        );

        useEffect(() => {
            presenter.load();
        }, []);

        const applyFilter = async (filterId: string) => {
            await presenter.applyFilter(filterId);
            if (presenter.vm.appliedFilter) {
                onApplyFilter(presenter.vm.appliedFilter);
            }
        };

        return (
            <>
                <AdvancedSearchContainer>
                    <Button onClick={() => presenter.openManager()} />
                    {presenter.vm.appliedFilter ? (
                        <SelectedFilter
                            queryObject={presenter.vm.appliedFilter}
                            onEdit={() => presenter.editAppliedFilter()}
                            onDelete={() => presenter.unsetFilter()}
                        />
                    ) : null}
                </AdvancedSearchContainer>
                <QueryManagerDialog
                    onClose={() => presenter.closeManager()}
                    onCreate={() => presenter.onManagerCreateFilter()}
                    onEdit={filterId => presenter.editFilter(filterId)}
                    onDelete={filterId => presenter.deleteFilter(filterId)}
                    onSelect={applyFilter}
                    vm={presenter.vm.managerVm}
                />
                <QueryBuilderDrawer
                    fields={fields}
                    modelId={modelId}
                    onClose={() => presenter.closeBuilder()}
                    onPersist={filter => presenter.onBuilderPersist(filter)}
                    onSubmit={filter => presenter.onBuilderSubmit(filter)}
                    open={presenter.vm.showBuilder}
                    queryObject={presenter.vm.queryObject}
                />
                {/* TODO: fix the "mode" problem */}
                <QuerySaverDialog
                    mode={"CREATE"}
                    onSubmit={filter => presenter.onSaverSubmit(filter)}
                    onClose={() => presenter.closeSaver()}
                    open={presenter.vm.showSaver}
                    queryObject={presenter.vm.queryObject}
                    repository={queryObjectRepository}
                />
            </>
        );
    }
);
