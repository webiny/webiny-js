import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { DialogHeader } from "./dialog/DialogHeader";
import { Search } from "./Search";
import { Entry } from "./Entry";
import { DialogActions, DialogContent as BaseDialogContent } from "~/admin/components/Dialog";
import { CmsEditorFieldRendererProps } from "~/types";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { Dialog } from "./dialog/Dialog";
import { AbsoluteLoader } from "~/admin/plugins/fieldRenderers/ref/advanced/components/Loader";

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
    padding: "0 2px"
});

const DialogContent = styled(BaseDialogContent)({
    padding: "0 !important"
});

const isSelected = (id: string, values: CmsReferenceValue[]) => {
    if (!id) {
        return false;
    }
    return values.some(value => {
        const { id: entryId } = parseIdentifier(id);
        const { id: valueEntryId } = parseIdentifier(value.id);
        return entryId === valueEntryId;
    });
};

interface Props extends CmsEditorFieldRendererProps {
    values?: CmsReferenceValue[] | null;
    onDialogClose: () => void;
    storeValues: (values: CmsReferenceValue[]) => void;
    multiple: boolean;
}
export const ReferencesDialog: React.FC<Props> = props => {
    const { contentModel, onDialogClose, storeValues, values: initialValues, multiple } = props;
    const { showSnackbar } = useSnackbar();

    const [values, setValues] = useState<CmsReferenceValue[]>(initialValues || []);
    const [error, setError] = useState<string | null>(null);
    const [references, setReferences] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!error) {
            return;
        }
        showSnackbar(error);
    }, [error]);
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

    return (
        <>
            <Dialog open={true} onClose={onDialogClose}>
                <DialogHeader model={contentModel} onClose={onDialogClose} />
                <DialogContent>
                    <Container>
                        <Search
                            model={contentModel}
                            setError={setError}
                            setEntries={setReferences}
                            setLoading={setLoading}
                        />
                        <Content>
                            {loading && <AbsoluteLoader />}
                            {references.map(reference => {
                                return (
                                    <Entry
                                        key={`reference-${reference.id}`}
                                        entry={reference}
                                        selected={isSelected(reference.id, values)}
                                        onChange={onChange}
                                    />
                                );
                            })}
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
