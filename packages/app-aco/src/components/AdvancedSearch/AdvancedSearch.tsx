import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useToast } from "@webiny/admin-ui";

import type { FieldDTOWithElement, FilterDTO, FilterRepository } from "./domain/index.js";

import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter.js";

import { Button } from "./Button/index.js";
import { QueryManagerDialog } from "./QueryManagerDialog/index.js";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer/index.js";
import { QuerySaverDialog } from "./QuerySaverDialog/index.js";
import { SelectedFilter } from "./SelectedFilter/index.js";

export interface AdvancedSearchProps {
    fields: FieldDTOWithElement[];
    repository: FilterRepository;
    onApplyFilter: (data: FilterDTO | null) => void;
}

export const AdvancedSearch = observer(
    ({ fields, repository, onApplyFilter }: AdvancedSearchProps) => {
        const { showToast } = useToast();

        const presenter = useMemo<AdvancedSearchPresenter>(() => {
            return new AdvancedSearchPresenter(repository);
        }, [repository]);

        useEffect(() => {
            presenter.load();
        }, []);

        const applyFilter = async (filter: string | FilterDTO) => {
            await presenter.applyFilter(filter);
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
            if (filterId === presenter.vm.appliedFilter?.id) {
                unsetFilter();
            }
        };

        const persistAndApplyFilter = async (filter: FilterDTO) => {
            await presenter.persistFilter(filter);
            onApplyFilter(filter);
        };

        useEffect(() => {
            if (presenter.vm.feedbackVm.isOpen) {
                showToast({
                    title: presenter.vm.feedbackVm.message
                });
            }
        }, [presenter.vm.feedbackVm.isOpen, presenter.vm.feedbackVm.message]);

        return (
            <>
                <div
                    className={
                        "flex flex-row-reverse justify-between items-center gap-sm"
                    }
                >
                    <Button onClick={() => presenter.openManager()} />
                    {presenter.vm.appliedFilter ? (
                        <SelectedFilter
                            filter={presenter.vm.appliedFilter}
                            onEdit={() => presenter.editAppliedFilter()}
                            onDelete={unsetFilter}
                        />
                    ) : null}
                </div>
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
                {presenter.vm.currentFilter ? (
                    <>
                        <QueryBuilderDrawer
                            fields={fields}
                            onClose={() => presenter.closeBuilder()}
                            onSave={filter => presenter.saveFilter(filter)}
                            onApply={applyFilter}
                            onValidationError={message => presenter.showFeedback(message)}
                            filter={presenter.vm.currentFilter}
                            vm={presenter.vm.builderVm}
                        />
                        <QuerySaverDialog
                            onSave={persistAndApplyFilter}
                            onClose={() => presenter.closeSaver()}
                            filter={presenter.vm.currentFilter}
                            vm={presenter.vm.saverVm}
                        />
                    </>
                ) : null}
            </>
        );
    }
);
