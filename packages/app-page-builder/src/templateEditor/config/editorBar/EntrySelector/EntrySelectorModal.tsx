import React from "react";

import { Container, Content, DialogContent } from "./styles";

import { parseIdentifier } from "@webiny/utils";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";

import { DialogActions } from "@webiny/app-headless-cms/admin/components/Dialog";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { Entries } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Entries";
import { Entry } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Entry";
import { Search } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Search";
import { AbsoluteLoader } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Loader";
import { Dialog } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/dialog/Dialog";
import { DialogHeader } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/dialog/DialogHeader";

const useIsSelected = (entryId: string, values: any[]) => {
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

export interface EntrySelectorModalProps {
    open: boolean;
    loading: boolean;
    entries: any;
    values: any;
    onClose: () => void;
    onInput: (ev: React.KeyboardEvent<HTMLInputElement>) => void;
    onChange: (entry: any) => void;
    onSave: () => void;
    loadMore: () => void;
    model: any;
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
    onSave,
    model
}: EntrySelectorModalProps) => {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogHeader model={model as CmsModel} onClose={onClose} />
            <DialogContent>
                <Container>
                    <Search onInput={onInput} />
                    <Content>
                        {loading && <AbsoluteLoader />}
                        {entries && (
                            <Entries entries={entries} loadMore={loadMore}>
                                {entry => {
                                    return (
                                        <Entry
                                            model={model as CmsModel}
                                            key={`reference-entry-${entry.id}`}
                                            entry={entry}
                                            selected={useIsSelected(entry.id, values)}
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
