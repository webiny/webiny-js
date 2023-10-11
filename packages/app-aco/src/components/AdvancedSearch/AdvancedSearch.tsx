import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useApolloClient } from "@apollo/react-hooks";

import {
    FieldRaw,
    FiltersGraphQLGateway,
    QueryObjectDTO,
    QueryObjectRepository
} from "./QueryObject";
import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";

import { Button } from "./Button";
import { Feedback } from "./Feedback";
import { QueryManagerDialog } from "./QueryManagerDialog";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer";
import { QuerySaverDialog } from "./QuerySaverDialog";
import { SelectedFilter } from "./SelectedFilter";

import { AdvancedSearchContainer } from "./AdvancedSearch.styled";

interface AdvancedSearchProps {
    fields: FieldRaw[];
    modelId: string;
    onApplyFilter: (data: QueryObjectDTO | null) => void;
}

export const AdvancedSearch = observer(
    ({ fields, modelId, onApplyFilter }: AdvancedSearchProps) => {
        const client = useApolloClient();

        const [repository] = useState(
            QueryObjectRepository.getInstance(new FiltersGraphQLGateway(client), modelId)
        );
        const [presenter] = useState<AdvancedSearchPresenter>(
            new AdvancedSearchPresenter(repository)
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

        const unsetFilter = () => {
            if (presenter.vm.appliedFilter) {
                presenter.unsetFilter();
                onApplyFilter(null);
            }
        };

        const deleteFilter = async (filterId: string) => {
            await presenter.deleteFilter(filterId);
            unsetFilter();
        };

        const applyQueryObject = async (queryObject: QueryObjectDTO) => {
            await presenter.applyQueryObject(queryObject);
            if (presenter.vm.appliedFilter) {
                onApplyFilter(presenter.vm.appliedFilter);
            }
        };

        const saveFilterAndApply = async (filter: QueryObjectDTO) => {
            await presenter.saveFilter(filter);

            onApplyFilter(filter);

            console.log("saveFilterAndApply", filter);
            console.log("appliedFilter", presenter.vm.appliedFilter);
            console.log("currentFilter", presenter.vm.currentFilter);
        };

        return (
            <>
                <AdvancedSearchContainer>
                    <Button onClick={() => presenter.openManager()} />
                    {presenter.appliedFilter ? (
                        <SelectedFilter
                            filter={presenter.appliedFilter}
                            onEdit={() => presenter.editAppliedFilter()}
                            onDelete={unsetFilter}
                        />
                    ) : null}
                </AdvancedSearchContainer>
                <QueryManagerDialog
                    onClose={() => presenter.closeManager()}
                    onCreate={() => presenter.createFilter()}
                    onEdit={filterId => presenter.editFilter(filterId)}
                    onDelete={deleteFilter}
                    onSelect={applyFilter}
                    vm={presenter.vm.managerVm}
                />
                {presenter.currentFilter ? (
                    <>
                        <QueryBuilderDrawer
                            fields={fields}
                            modelId={modelId}
                            onClose={() => presenter.closeBuilder()}
                            onPersist={filter => presenter.persistFilter(filter)}
                            onSubmit={applyQueryObject}
                            queryObject={presenter.currentFilter}
                            open={presenter.vm.builderVm.open}
                        />
                        <QuerySaverDialog
                            onSubmit={saveFilterAndApply}
                            onClose={() => presenter.closeSaver()}
                            open={presenter.vm.saverVm.open}
                            isLoading={presenter.vm.saverVm.isLoading}
                            loadingLabel={presenter.vm.saverVm.loadingLabel}
                            queryObject={presenter.currentFilter}
                        />
                    </>
                ) : null}
                <Feedback
                    isOpen={presenter.vm.feedbackVm.isOpen}
                    message={presenter.vm.feedbackVm.message}
                />
            </>
        );
    }
);
