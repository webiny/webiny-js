import React, { useEffect, useState, useCallback, useRef } from "react";

import { parseIdentifier } from "@webiny/utils";
import { ButtonDefault, ButtonPrimary } from "@webiny/ui/Button";
import { DialogActions } from "@webiny/app-headless-cms/admin/components/Dialog";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { Entries } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Entries";
import { Entry } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Entry";
import { Search } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Search";
import { AbsoluteLoader } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/components/Loader";
import { Dialog } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/components/dialog/Dialog";
import { DialogHeader } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/components/dialog/DialogHeader";
import { useEntries } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/hooks/useEntries";

import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";

import { Container, Content, DialogContent } from "./styles";

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

interface EntrySelectorModalProps {
    sourceModel: CmsModel;
    onClose: () => void;
}

export const EntrySelectorModal = ({ sourceModel, onClose }: EntrySelectorModalProps) => {
    const [templateAtomValue] = useTemplate();

    const defaultValues = templateAtomValue?.dynamicSource
        ? [
              {
                  id: templateAtomValue?.dynamicSource?.entryId,
                  modelId: templateAtomValue?.dynamicSource?.modelId
              }
          ]
        : [];

    const [values, setValues] = useState<Record<string, string | undefined>[]>(defaultValues);

    const handler = useEventActionHandler();

    const { entries, loading, runSearch, loadMore } = useEntries({
        model: sourceModel,
        limit: 10
    });

    useEffect(() => {
        runSearch("");
    }, []);

    const updateTemplate = (data: any) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data
            })
        );
    };

    useEffect(() => {
        if (entries !== undefined && !values.length) {
            setValues([
                {
                    modelId: entries[0]?.model?.modelId,
                    id: entries[0]?.entryId
                }
            ]);
        }
    }, [entries]);

    const onSave = useCallback(() => {
        const entryId = values.reduce((acc: any, curEntry: any) => curEntry?.id, "0");

        updateTemplate({
            dynamicSource: { entryId, modelId: sourceModel?.modelId }
        });

        onClose();
    }, [setValues, values]);

    const onChange = useCallback(
        entry => {
            setValues([entry]);

            if (values.length) {
                const [value] = values;
                if (entry.id === value.id) {
                    setValues([]);
                }
            }
        },
        [setValues, values]
    );

    const debouncedSearch = useRef<number | null>(null);

    const onInput = useCallback(ev => {
        const value = (String(ev.target.value) || "").trim();
        if (debouncedSearch.current) {
            clearTimeout(debouncedSearch.current);
            debouncedSearch.current = null;
        }

        debouncedSearch.current = setTimeout(() => {
            runSearch(value);
        }, 200) as unknown as number;
    }, []);

    return (
        <Dialog open={true} onClose={onClose}>
            <DialogHeader model={sourceModel} onClose={onClose} />
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
                                            model={sourceModel}
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
