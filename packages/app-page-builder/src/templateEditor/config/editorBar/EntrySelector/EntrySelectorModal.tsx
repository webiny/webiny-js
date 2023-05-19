import React from "react";
import styled from "@emotion/styled";
import { Dialog } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/dialog/Dialog";
import { Entries } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Entries";
import { Entry } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Entry";
import { DialogHeader } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/dialog/DialogHeader";
import {
    DialogActions,
    DialogContent as BaseDialogContent
} from "@webiny/app-headless-cms/admin/components/Dialog";
import { Search } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Search";
import { AbsoluteLoader } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Loader";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { parseIdentifier } from "@webiny/utils";

const isSelected = (entryId: string, values: any[]) => {
    if (!entryId) {
        return false;
    }
    return values.some(value => {
        if (value.id === undefined) {
            return;
        }
        const { id: valueEntryId } = parseIdentifier(value.id);
        const { id: parsedEntryId } = parseIdentifier(entryId || "");
        return parsedEntryId === valueEntryId;
    });
};

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
    minHeight: "20px",
    boxSizing: "border-box",
    padding: "20px 0 20px 20px",
    backgroundColor: "var(--mdc-theme-background)",
    border: "1px solid var(--mdc-theme-on-background)",
    overflowX: "hidden"
});

const DialogContent = styled(BaseDialogContent)({
    padding: "0 !important"
});

export interface EntrySelectorModalProps {
    open: boolean;
    loading: boolean;
    entries: any;
    values: any;
    onClose: () => void;
    onInput: (ev: React.KeyboardEvent<HTMLInputElement>) => void;
    onChange: (entry: any) => void;
    onSave: () => void;
    loadMore: any;
}

export const EntrySelectorModal = ({
    open,
    loading,
    loadMore,
    entries,
    values,
    onChange,
    onClose,
    onInput,
    onSave
}: EntrySelectorModalProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogHeader model={"blog" as any} onClose={onClose} />
            <DialogContent>
                <Container>
                    <Search onInput={onInput} />
                    <Content>
                        {loading && <AbsoluteLoader />}
                        {entries && (
                            <Entries entries={entries} loadMore={loadMore}>
                                {(entry: any) => {
                                    return (
                                        <Entry
                                            model={{ icon: "" } as any}
                                            key={`reference-entry-${entry.id}`}
                                            entry={entry}
                                            selected={isSelected(entry.id, values)}
                                            onChange={onChange}
                                        />
                                    );
                                }}
                            </Entries>
                        )}
                    </Content>
                </Container>
            </DialogContent>
            <DialogActions>
                <ButtonDefault onClick={onClose}>Cancel</ButtonDefault>
                <ButtonPrimary onClick={onSave}>Save</ButtonPrimary>
            </DialogActions>
        </Dialog>
    );
};
