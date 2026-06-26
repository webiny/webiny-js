import React, { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { createFieldRenderer } from "@webiny/app-admin/features/formModel/createFieldRenderer.js";
import type { IFieldVM } from "@webiny/app-admin/features/formModel/abstractions.js";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { FormComponentErrorMessage, FormComponentLabel, OverlayLoader } from "@webiny/admin-ui";
import type { CmsModel } from "~/types.js";
import type { CmsReferenceEntry, CmsReferenceValue } from "~/features/contentEntry/refTypes.js";
import type { RefFieldRendererSettings } from "./types.js";
import { RefDetailedPresenterFeature } from "./detailed/feature.js";
import { EntryCard } from "./components/EntryCard.js";
import { RefFieldOptions } from "./components/RefFieldOptions.js";
import { ReferencesDialog } from "./components/ReferencesDialog.js";
import { NewEntryDrawer } from "./components/NewEntryDrawer.js";

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refDetailedSingle: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}

export const CmsRefDetailedSingleRenderer = createFieldRenderer<"refDetailedSingle">(
    ({ field }) => {
        const parentContainer = useContainer();

        const scopedContainer = useMemo(() => {
            const child = parentContainer.createChildContainer();
            RefDetailedPresenterFeature.register(child);
            return child;
        }, []);

        return (
            <DiContainerProvider container={scopedContainer}>
                <RefDetailedSingleInner field={field} />
            </DiContainerProvider>
        );
    }
);

interface InnerFieldProps {
    field: IFieldVM & { rendererSettings: RefFieldRendererSettings };
}

const RefDetailedSingleInner = observer(({ field }: InnerFieldProps) => {
    const { presenter } = useFeature(RefDetailedPresenterFeature);

    const [selectDialogModel, setSelectDialogModel] = useState<CmsModel | null>(null);
    const [newEntryModelId, setNewEntryModelId] = useState<string | null>(null);

    const settings = field.rendererSettings;
    const modelIds = (settings.models || []).map(m => m.modelId);

    useEffect(() => {
        presenter.init({ modelIds, multiSelect: false });
    }, []);

    const value = field.value as CmsReferenceValue | null;

    useEffect(() => {
        if (value) {
            presenter.resolveValues([value]);
        } else {
            presenter.resolveValues([]);
        }
    }, [value?.id]);

    const onRemove = useCallback(() => {
        field.onChange(null);
    }, []);

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
        (values: CmsReferenceValue[], entries: CmsReferenceEntry[]) => {
            presenter.addEntries(entries);
            if (values.length === 0) {
                field.onChange(null);
            } else {
                field.onChange(values[0]);
            }
        },
        []
    );

    const { validation } = field;
    const invalid = validation.isValid === false;
    const disabled = field.disabled;
    const entry = presenter.vm.entries[0];
    const models = presenter.vm.models;

    return (
        <div className={"@container"}>
            <FormComponentLabel text={field.label} invalid={invalid} disabled={disabled} />
            <div className={"webiny_ref-field-container"}>
                {presenter.vm.loading && <OverlayLoader size={"md"} />}
                {entry && (
                    <EntryCard
                        model={
                            presenter.vm.models.find(m => m.modelId === entry.model.modelId) ||
                            ({
                                modelId: entry.model.modelId,
                                name: entry.model.name
                            } as CmsModel)
                        }
                        placement="singleRefField"
                        index={0}
                        entry={entry}
                        onRemove={onRemove}
                        disabled={disabled}
                    />
                )}
            </div>
            <FormComponentErrorMessage
                text={validation.message}
                invalid={invalid}
                disabled={disabled}
            />
            {entry && <div className="mb-md" />}
            {!disabled && (
                <RefFieldOptions
                    models={models}
                    onNewRecord={onNewRecord}
                    onLinkExistingRecord={onExistingRecord}
                />
            )}
            {selectDialogModel && (
                <ReferencesDialog
                    model={selectDialogModel}
                    values={value ? [value] : []}
                    multiple={false}
                    onSave={onDialogSave}
                    onClose={() => setSelectDialogModel(null)}
                />
            )}
            {newEntryModelId && (
                <NewEntryDrawer
                    modelId={newEntryModelId}
                    onClose={() => setNewEntryModelId(null)}
                    onChange={ref => {
                        field.onChange(ref);
                        setNewEntryModelId(null);
                    }}
                />
            )}
        </div>
    );
});
