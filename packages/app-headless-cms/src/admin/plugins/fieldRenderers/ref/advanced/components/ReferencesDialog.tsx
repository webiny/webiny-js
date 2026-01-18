import React, { useCallback, useEffect, useState } from "react";
import { Search } from "./Search.js";
import { Entry } from "./Entry.js";
import type { CmsModelField, CmsModelFieldRendererProps } from "~/types.js";
import type { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types.js";
import { useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { useEntries } from "~/admin/plugins/fieldRenderers/ref/advanced/hooks/useEntries.js";
import { Entries } from "./Entries.js";
import type { MultiRefFieldSettings } from "~/admin/plugins/fieldRenderers/ref/advanced/components/AdvancedMultipleReferenceSettings.js";
import { Dialog, OverlayLoader } from "@webiny/admin-ui";

const isSelected = (entryId: string, values: CmsReferenceValue[]) => {
    if (!entryId) {
        return false;
    }
    return values.some(value => {
        const { id: valueEntryId } = parseIdentifier(value.id);
        return entryId === valueEntryId;
    });
};

interface ReferencesDialogProps extends CmsModelFieldRendererProps {
    values?: CmsReferenceValue[] | null;
    field: CmsModelField;
    onDialogClose: () => void;
    storeValues: (values: CmsReferenceValue[]) => void;
    multiple: boolean;
}

const getSettings = (field: CmsModelField) => {
    if (typeof field.renderer === "function") {
        return undefined;
    }

    return field.renderer.settings as MultiRefFieldSettings;
};

export const ReferencesDialog = (props: ReferencesDialogProps) => {
    const { showSnackbar } = useSnackbar();

    const {
        contentModel,
        onDialogClose,
        storeValues,
        values: initialValues,
        multiple,
        field
    } = props;

    const [values, setValues] = useState<CmsReferenceValue[]>(initialValues || []);
    const [searchValue, setSearchValue] = useState<string>("");
    const rendererSettings = getSettings(field);
    const newItemPosition = rendererSettings?.newItemPosition ?? "last";

    /**
     * On change needs to handle the adding or removing of a reference.
     *
     * This is for both single and multiple reference fields.
     */
    const onChange = useCallback(
        (reference: CmsReferenceValue) => {
            const { id: referenceEntryId } = parseIdentifier(reference.id);
            /**
             * Let's handle the single usage first as it is quite simple.
             */
            if (!multiple) {
                const [value] = values;
                if (!value?.id) {
                    setValues([reference]);
                    return;
                }
                const { id: valueEntryId } = parseIdentifier(value.id);
                if (referenceEntryId === valueEntryId) {
                    setValues([]);
                    return;
                }
                setValues([reference]);
                return;
            }

            const newValues = values.filter(value => {
                if (!value?.id) {
                    return false;
                }
                const { id: valueEntryId } = parseIdentifier(value.id);
                return referenceEntryId !== valueEntryId;
            });

            if (newValues.length === values.length) {
                setValues(values => {
                    if (newItemPosition === "first") {
                        return [reference, ...values];
                    }
                    return [...values, reference];
                });
                return;
            }
            setValues(newValues);
        },
        [setValues, values]
    );

    const onDialogSave = useCallback(() => {
        storeValues(values);
        onDialogClose();
    }, [values]);
    /**
     * Searching and list of reference entries.
     */
    const { entries, loading, error, runSearch, loadMore } = useEntries({
        model: contentModel,
        limit: 10
    });

    useEffect(() => {
        runSearch("");
    }, []);

    useEffect(() => {
        if (!error) {
            return;
        }
        showSnackbar(error);
    }, [error]);

    const onInput = useCallback((value: string) => {
        runSearch(value);
        setSearchValue(value);
    }, []);

    return (
        <>
            <Dialog
                open={true}
                onClose={onDialogClose}
                title={"Select an existing record"}
                description={`Content model: ${contentModel.name}`}
                actions={
                    <>
                        <Dialog.CancelAction />
                        <Dialog.ConfirmAction onClick={onDialogSave} text="Save" />
                    </>
                }
            >
                <>
                    {loading && <OverlayLoader />}
                    <Search onChange={onInput} value={searchValue} />
                    <Entries entries={entries} loadMore={loadMore}>
                        {entry => {
                            return (
                                <Entry
                                    model={contentModel}
                                    key={`reference-entry-${entry.id}`}
                                    entry={entry}
                                    selected={isSelected(entry.entryId, values)}
                                    onChange={onChange}
                                />
                            );
                        }}
                    </Entries>
                </>
            </Dialog>
        </>
    );
};
