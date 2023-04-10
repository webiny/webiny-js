import React, { useCallback, useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";
import { DialogHeader } from "./dialog/DialogHeader";
import { Search } from "./Search";
import { Entry } from "./Entry";
import { DialogActions, DialogContent as BaseDialogContent } from "~/admin/components/Dialog";
import { CmsModelFieldRendererProps } from "~/types";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { Dialog } from "./dialog/Dialog";
import { AbsoluteLoader } from "~/admin/plugins/fieldRenderers/ref/advanced/components/Loader";
import { useEntries } from "~/admin/plugins/fieldRenderers/ref/advanced/hooks/useEntries";
import { Entries } from "./Entries";

const Container = styled("div")({
    width: "100%",
    boxSizing: "border-box",
    padding: "20px"
});

const Content = styled("div")({
    display: "flex",
    flex: "1",
    flexDirection: "column",
    position: "relative",
    width: "100%",
    minHeight: "100px",
    boxSizing: "border-box",
    padding: "20px 0 20px 20px",
    backgroundColor: "var(--mdc-theme-background)",
    border: "1px solid var(--mdc-theme-on-background)",
    overflowX: "hidden"
});

const DialogContent = styled(BaseDialogContent)({
    padding: "0 !important"
});

const isSelected = (entryId: string, values: CmsReferenceValue[]) => {
    if (!entryId) {
        return false;
    }
    return values.some(value => {
        const { id: valueEntryId } = parseIdentifier(value.id);
        return entryId === valueEntryId;
    });
};

interface Props extends CmsModelFieldRendererProps {
    values?: CmsReferenceValue[] | null;
    onDialogClose: () => void;
    storeValues: (values: CmsReferenceValue[]) => void;
    multiple: boolean;
}

export const ReferencesDialog: React.VFC<Props> = props => {
    const { contentModel, onDialogClose, storeValues, values: initialValues, multiple } = props;
    const { showSnackbar } = useSnackbar();

    const [values, setValues] = useState<CmsReferenceValue[]>(initialValues || []);

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
                setValues([...values, reference]);
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

    const debouncedSearch = useRef<number | null>(null);

    const onInput = useCallback(ev => {
        const value = (String(ev.target.value) || "").trim();
        if (debouncedSearch.current) {
            clearTimeout(debouncedSearch.current);
            debouncedSearch.current = null;
        }
        /**
         * We can safely cast as setTimeout really produces a number.
         * There is an error while coding because Storm thinks this is NodeJS timeout.
         */
        debouncedSearch.current = setTimeout(() => {
            runSearch(value);
        }, 200) as unknown as number;
    }, []);

    return (
        <>
            <Dialog open={true} onClose={onDialogClose}>
                <DialogHeader model={contentModel} onClose={onDialogClose} />
                <DialogContent>
                    <Container>
                        <Search onInput={onInput} />
                        <Content>
                            {loading && <AbsoluteLoader />}
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
                        </Content>
                    </Container>
                </DialogContent>
                <DialogActions>
                    <ButtonDefault onClick={onDialogClose}>Cancel</ButtonDefault>
                    <ButtonPrimary onClick={onDialogSave}>Save</ButtonPrimary>
                </DialogActions>
            </Dialog>
        </>
    );
};
