import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useApolloClient } from "@apollo/react-hooks";

import { FieldRaw, QueryObjectDTO, FilterRepository } from "./domain";
import { FiltersGraphQLGateway } from "./gateways";

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
    namespace: string;
    onApplyFilter: (data: QueryObjectDTO | null) => void;
}

export const AdvancedSearch = observer(
    ({ fields, namespace, onApplyFilter }: AdvancedSearchProps) => {
        const client = useApolloClient();

        const [repository] = useState(
            FilterRepository.getInstance(new FiltersGraphQLGateway(client), namespace)
        );
        const [presenter] = useState<AdvancedSearchPresenter>(
            new AdvancedSearchPresenter(repository)
        );

        useEffect(() => {
            presenter.load();
        }, []);

        const applyFilter = async (filter: string | QueryObjectDTO) => {
            await presenter.applyFilter(filter);
            if (presenter.vm.appliedQueryObject) {
                onApplyFilter(presenter.vm.appliedQueryObject);
            }
        };

        const unsetFilter = () => {
            if (presenter.vm.appliedQueryObject) {
                presenter.unsetFilter();
                onApplyFilter(null);
            }
        };

        const deleteFilter = async (filterId: string) => {
            await presenter.deleteFilter(filterId);
            if (filterId === presenter.vm.appliedQueryObject?.id) {
                unsetFilter();
            }
        };

        const persistQueryObjectAndApply = async (queryObject: QueryObjectDTO) => {
            await presenter.persistQueryObject(queryObject);
            onApplyFilter(queryObject);
        };

        return (
            <>
                <AdvancedSearchContainer>
                    <Button onClick={() => presenter.openManager()} />
                    {presenter.vm.appliedQueryObject ? (
                        <SelectedFilter
                            queryObject={presenter.vm.appliedQueryObject}
                            onEdit={() => presenter.editAppliedQueryObject()}
                            onDelete={unsetFilter}
                        />
                    ) : null}
                </AdvancedSearchContainer>
                <QueryManagerDialog
                    onClose={() => presenter.closeManager()}
                    onCreate={() => presenter.createFilter()}
                    onEdit={filterId => presenter.editFilter(filterId)}
                    onRename={filterId => presenter.renameFilter(filterId)}
                    onClone={filterId => presenter.cloneFilter(filterId)}
                    onDelete={deleteFilter}
                    onSelect={applyFilter}
                    vm={presenter.vm.managerVm}
                />
                {presenter.vm.currentQueryObject ? (
                    <>
                        <QueryBuilderDrawer
                            fields={fields}
                            onClose={() => presenter.closeBuilder()}
                            onSave={queryObject => presenter.saveQueryObject(queryObject)}
                            onSubmit={applyFilter}
                            onValidationError={message => presenter.showFeedback(message)}
                            queryObject={presenter.vm.currentQueryObject}
                            vm={presenter.vm.builderVm}
                        />
                        <QuerySaverDialog
                            onSubmit={persistQueryObjectAndApply}
                            onClose={() => presenter.closeSaver()}
                            queryObject={presenter.vm.currentQueryObject}
                            vm={presenter.vm.saverVm}
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
