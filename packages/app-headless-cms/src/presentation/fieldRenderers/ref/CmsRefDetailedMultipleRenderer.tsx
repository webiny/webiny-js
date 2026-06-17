import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { FormComponentErrorMessage, FormComponentLabel } from "@webiny/admin-ui";
import type { CmsModel } from "~/types.js";
import type { CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefDetailedPresenterFeature } from "./detailed/feature.js";
import { EntryCard } from "./components/EntryCard.js";
import { EntryList } from "./components/EntryList.js";
import { RefFieldOptions } from "./components/RefFieldOptions.js";
import { ReferencesDialog } from "./components/ReferencesDialog.js";
import { NewEntryDrawer } from "./components/NewEntryDrawer.js";
import { parseIdentifier } from "@webiny/utils";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refDetailedMultiple: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefDetailedMultipleRenderer = createFieldRenderer<"refDetailedMultiple">(
    ({ field }) => {
        const parentContainer = useContainer();

        const scopedContainer = useMemo(() => {
            const child = parentContainer.createChildContainer();
            RefDetailedPresenterFeature.register(child);
            return child;
        }, []);

        return (
            <DiContainerProvider container={scopedContainer}>
                <RefDetailedMultipleInner field={field} />
            </DiContainerProvider>
        );
    }
);

interface InnerFieldProps {
    field: IFieldVM & { rendererSettings: RefFieldRendererSettings };
}

const RefDetailedMultipleInner = observer(({ field }: InnerFieldProps) => {
    const { presenter } = useFeature(RefDetailedPresenterFeature);

    const [selectDialogModel, setSelectDialogModel] = useState<CmsModel | null>(null);
    const [newEntryModelId, setNewEntryModelId] = useState<string | null>(null);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);

    useEffect(() => {
        presenter.init({ modelIds, multiSelect: true });
    }, []);

    const values: CmsReferenceValue[] = Array.isArray(field.value) ? field.value : [];

    useEffect(() => {
        presenter.resolveValues(values);
    }, [values.map(v => v.id).join(",")]);

    const onRemove = useCallback(
        (id: string) => {
            const { id: entryId } = parseIdentifier(id);
            const newValues = values.filter(v => {
                const { id: vEntryId } = parseIdentifier(v.id);
                return vEntryId !== entryId;
            });
            field.onChange(newValues.length > 0 ? newValues : null);
        },
        [values]
    );

    const onMoveUp = useCallback(
        (index: number, toTop?: boolean) => {
            if (values.length === 0) {
                return;
            }
            const newValues = [...values];
            if (toTop) {
                const [item] = newValues.splice(index, 1);
                newValues.unshift(item);
            } else {
                const temp = newValues[index - 1];
                newValues[index - 1] = newValues[index];
                newValues[index] = temp;
            }
            field.onChange(newValues);
        },
        [values]
    );

    const onMoveDown = useCallback(
        (index: number, toBottom?: boolean) => {
            if (values.length === 0) {
                return;
            }
            const newValues = [...values];
            if (toBottom) {
                const [item] = newValues.splice(index, 1);
                newValues.push(item);
            } else {
                const temp = newValues[index + 1];
                newValues[index + 1] = newValues[index];
                newValues[index] = temp;
            }
            field.onChange(newValues);
        },
        [values]
    );

    const onNewRecord = useCallback((modelId: string) => {
        setNewEntryModelId(modelId);
    }, []);

    const onExistingRecord = useCallback(
        (modelId: string) => {
            const model = presenter.vm.models.find(m => m.modelId === modelId);
            if (model) {
                setSelectDialogModel(model);
            }
        },
        [presenter.vm.models]
    );

    const onDialogSave = useCallback(
        (selectedValues: CmsReferenceValue[]) => {
            field.onChange(selectedValues.length > 0 ? selectedValues : null);
        },
        []
    );

    const { validation } = field;
    const invalid = validation.isValid === false;
    const disabled = field.disabled;

    return (
        <div className={"@container"}>
            <div className={"flex items-center justify-between"}>
                <FormComponentLabel text={field.label} invalid={invalid} disabled={disabled} />
            </div>
            <div className={"webiny_ref-field-container"}>
                <EntryList
                    entries={presenter.vm.entries}
                    loadMore={() => presenter.loadMore()}
                >
                    {(entry, index) => {
                        const isFirst = index === 0;
                        const isLast = index >= values.length - 1;
                        const model = presenter.vm.models.find(
                            m => m.modelId === entry.model.modelId
                        );
                        if (!model) {
                            return null;
                        }
                        return (
                            <EntryCard
                                disabled={disabled}
                                model={model}
                                placement="multiRef"
                                index={index}
                                entry={entry}
                                onRemove={onRemove}
                                onMoveUp={!isFirst ? onMoveUp : undefined}
                                onMoveDown={!isLast ? onMoveDown : undefined}
                            />
                        );
                    }}
                </EntryList>
            </div>
            <FormComponentErrorMessage
                text={validation.message}
                invalid={invalid}
                disabled={disabled}
            />
            {values.length > 0 && <div className="mb-md" />}
            {!disabled && (
                <RefFieldOptions
                    models={presenter.vm.models}
                    onNewRecord={onNewRecord}
                    onLinkExistingRecord={onExistingRecord}
                />
            )}
            {selectDialogModel && (
                <ReferencesDialog
                    model={selectDialogModel}
                    values={values}
                    multiple={true}
                    onSave={onDialogSave}
                    onClose={() => setSelectDialogModel(null)}
                />
            )}
            {newEntryModelId && (
                <NewEntryDrawer
                    modelId={newEntryModelId}
                    onClose={() => setNewEntryModelId(null)}
                    onChange={ref => {
                        field.onChange(
                            values.concat([ref]).length > 0 ? values.concat([ref]) : null
                        );
                        setNewEntryModelId(null);
                    }}
                />
            )}
        </div>
    );
});
