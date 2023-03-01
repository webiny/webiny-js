import React, { useCallback, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { css } from "emotion";
import { DialogHeader } from "./dialog/DialogHeader";
import { Search } from "./Search";
import { Entry } from "./Entry";
import {
    Dialog as BaseDialog,
    DialogActions,
    DialogContent as BaseDialogContent
} from "~/admin/components/Dialog";
import { CmsEditorFieldRendererProps } from "~/types";
import {
    CmsReferenceContentEntry,
    CmsReferenceValue
} from "~/admin/plugins/fieldRenderers/ref/components/types";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { useSnackbar } from "@webiny/app-admin";
import { parseIdentifier } from "@webiny/utils";
import { Loader } from "./Loader";

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

const Dialog = styled(BaseDialog)({
    minWidth: "800px",
    ".mdc-dialog__surface": {
        width: "auto",
        maxWidth: "800px",
        minWidth: "800px",
        maxHeight: "calc(100vh - 100px)"
    },
    ".mdc-dialog__content": {
        overflow: "auto !important"
    }
});

const DialogContent = styled(BaseDialogContent)({
    padding: "0 !important"
});

const isSelected = (entry: CmsReferenceContentEntry, value: CmsReferenceValue | null) => {
    if (!value?.id) {
        return false;
    }
    const { id: entryId } = parseIdentifier(value.id);
    return entry.entryId === entryId;
};

interface Props extends CmsEditorFieldRendererProps {
    entry: CmsReferenceContentEntry | null;
    value: CmsReferenceValue | null;
    onDialogClose: () => void;
    storeValue: (value: CmsReferenceValue | null) => void;
}
export const ReferencesDialog: React.FC<Props> = props => {
    const { contentModel, onDialogClose, storeValue, value: initialValue } = props;
    const { showSnackbar } = useSnackbar();

    const [value, setValue] = useState<CmsReferenceValue | null>(initialValue);
    const [error, setError] = useState<string | null>(null);
    const [references, setReferences] = useState<CmsReferenceContentEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    useEffect(() => {
        if (!error) {
            return;
        }
        showSnackbar(error);
    }, [error]);

    const onChange = useCallback(
        (reference: CmsReferenceValue | null) => {
            setValue(reference);
        },
        [setValue, value]
    );

    const onDialogSave = useCallback(() => {
        storeValue(value);
        onDialogClose();
    }, [value]);

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
                            {loading && <Loader />}
                            {references.map(reference => {
                                return (
                                    <Entry
                                        key={`reference-${reference.id}`}
                                        entry={reference}
                                        selected={isSelected(reference, value)}
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
