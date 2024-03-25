import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";

import { Field, FieldMapper, FieldRaw, FilterDTO, FilterRepository } from "./domain";

import { AdvancedSearchPresenter } from "./AdvancedSearchPresenter";

import { Button } from "./Button";
import { Feedback } from "./Feedback";
import { QueryManagerDialog } from "./QueryManagerDialog";
import { QueryBuilderDrawer } from "./QueryBuilderDrawer";
import { QuerySaverDialog } from "./QuerySaverDialog";
import { SelectedFilter } from "./SelectedFilter";

import { AdvancedSearchContainer } from "./AdvancedSearch.styled";
import { useAcoConfig } from "~/config";

export interface AdvancedSearchProps {
    fields: FieldRaw[];
    repository: FilterRepository;
    onApplyFilter: (data: FilterDTO | null) => void;
}

export const AdvancedSearch = observer(
    ({ fields, repository, onApplyFilter }: AdvancedSearchProps) => {
        const { advancedSearch } = useAcoConfig();

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

        const fieldsWithRenderer = useMemo(() => {
            const fieldDTOs = FieldMapper.toDTO(fields.map(field => Field.createFromRaw(field)));

            return fieldDTOs.map(field => {
                const config = advancedSearch.fieldRenderers.find(
                    config => config.type === field.type
                );
                const element = config?.element ?? null;
                return { ...field, element };
            });
        }, [fields, advancedSearch.fieldRenderers]);

        return (
            <>
                <AdvancedSearchContainer>
                    <Button onClick={() => presenter.openManager()} />
                    {presenter.vm.appliedFilter ? (
                        <SelectedFilter
                            filter={presenter.vm.appliedFilter}
                            onEdit={() => presenter.editAppliedFilter()}
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
                {presenter.vm.currentFilter ? (
                    <>
                        <QueryBuilderDrawer
                            fields={fieldsWithRenderer}
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
                <Feedback
                    isOpen={presenter.vm.feedbackVm.isOpen}
                    message={presenter.vm.feedbackVm.message}
                />
            </>
        );
    }
);
