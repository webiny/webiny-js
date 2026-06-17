import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer } from "@webiny/app";
import { useFeature } from "@webiny/app-admin";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";
import { ReactComponent as SearchIcon } from "@webiny/icons/search.svg";
import { Input, DelayedOnChange, Icon } from "@webiny/admin-ui";
import { ContentEntryFeature } from "~/features/contentEntry/feature.js";
import { RefDialogPresenterFeature } from "../dialog/feature.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { CmsModel } from "~/types.js";
import { EntryCard } from "./EntryCard.js";
import { EntryList } from "./EntryList.js";
import { parseIdentifier } from "@webiny/utils";

interface ReferencesDialogProps {
    model: CmsModel;
    values: CmsReferenceValue[];
    onSave: (values: CmsReferenceValue[]) => void;
    onClose: () => void;
    multiple: boolean;
}

export const ReferencesDialog = ({
    model,
    values,
    onSave,
    onClose,
    multiple
}: ReferencesDialogProps) => {
    const parentContainer = useContainer();

    const dialogContainer = useMemo(() => {
        const child = parentContainer.createChildContainer();
        ContentEntryFeature.register(child);
        RefDialogPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={dialogContainer}>
            <ReferencesDialogContent
                model={model}
                initialValues={values}
                onSave={onSave}
                onClose={onClose}
                multiple={multiple}
            />
        </DiContainerProvider>
    );
};

interface ReferencesDialogContentProps {
    model: CmsModel;
    initialValues: CmsReferenceValue[];
    onSave: (values: CmsReferenceValue[]) => void;
    onClose: () => void;
    multiple: boolean;
}

const ReferencesDialogContent = observer(
    ({ model, initialValues, onSave, onClose, multiple }: ReferencesDialogContentProps) => {
        const { presenter } = useFeature(RefDialogPresenterFeature);
        const [searchValue, setSearchValue] = useState("");

        useEffect(() => {
            presenter.init({ modelId: model.modelId, initialValues, multiple });
            return () => presenter.dispose();
        }, []);

        const selectedValues = presenter.vm.selectedValues;

        const isSelected = (entry: CmsReferenceEntry): boolean => {
            const { id: entryId } = parseIdentifier(entry.id);
            return selectedValues.some(v => {
                const { id: vEntryId } = parseIdentifier(v.id);
                return vEntryId === entryId;
            });
        };

        const onDialogSave = () => {
            onSave(presenter.save());
            onClose();
        };

        const onSearchChange = (value: string) => {
            setSearchValue(value);
            presenter.list.actions.search.set(value);
        };

        const listVm = presenter.list.vm;

        return (
            <Dialog
                className={"w-[800px]"}
                size={"lg"}
                open={true}
                onClose={onClose}
                title={"Select an existing record"}
                description={
                    <>
                        Content model:{" "}
                        <span className={"font-bold text-neutral-primary"}>{model.name}</span>
                    </>
                }
                actions={
                    <>
                        <Dialog.CancelAction />
                        <Dialog.ConfirmAction onClick={onDialogSave} text="Save" />
                    </>
                }
            >
                <div className={"relative"}>
                    {listVm.pagination.loading && <OverlayLoader />}
                    <div className={"flex flex-col gap-md"}>
                        <DelayedOnChange value={searchValue} onChange={onSearchChange}>
                            {({ value, onChange }) => (
                                <Input
                                    size={"lg"}
                                    placeholder={"Search entries..."}
                                    onChange={onChange}
                                    value={value}
                                    startIcon={<Icon label="Search" icon={<SearchIcon />} />}
                                />
                            )}
                        </DelayedOnChange>
                        <EntryList
                            entries={listVm.rows}
                            loadMore={() => presenter.list.actions.loadMore()}
                        >
                            {entry => (
                                <EntryCard
                                    model={model}
                                    entry={entry}
                                    selected={isSelected(entry)}
                                    onChange={ref => presenter.toggleEntry(ref)}
                                />
                            )}
                        </EntryList>
                    </div>
                </div>
            </Dialog>
        );
    }
);
