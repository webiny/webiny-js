import React, { useEffect, useState, useCallback, useRef } from "react";

import {
    EntrySelectorWrapper,
    SelectEntry,
    SelectedEntryTitle,
    SelectedEntryLable,
    SelectedEntryLeft,
    SelectedEntryRight
} from "./styles";
import { EditorBar } from "~/editor";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { useGetModelEntries } from "~/templateEditor/hooks/useGetModelEntries";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { EntrySelectorModal } from "./EntrySelectorModal";

import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { Icon } from "@webiny/ui/Icon";
import { CmsModel } from "@webiny/app-headless-cms/types";
import { useEntries } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/hooks/useEntries";
import { ReactComponent as OpenIcon } from "@material-symbols/svg-400/rounded/open_in_new-fill.svg";

const DefaultEntrySelector = () => {
    const [templateAtomValue] = useTemplate();
    const [toggleModal, setToggleModal] = useState<boolean>(false);
    const [selectedEntryTitle, setSelectedEntryTitle] = useState("Select Entry");
    const [entriesData, setEntriesData] = useState<any>();
    const { data, loading } = useGetModelEntries(templateAtomValue);

    const defaultValues = templateAtomValue?.templatePageData
        ? [
              {
                  id: templateAtomValue?.templatePageData?.entryId,
                  modelId: templateAtomValue?.templatePageData?.modelId
              }
          ]
        : [];

    const [values, setValues] = useState<Record<string, string | undefined>[]>(defaultValues);

    const handler = useEventActionHandler();

    const { entries, runSearch, loadMore } = useEntries({
        model: templateAtomValue?.sourceModel as CmsModel,
        limit: 10
    });

    const updateTemplate = (data: any) => {
        handler.trigger(
            new UpdateDocumentActionEvent({
                history: false,
                document: data
            })
        );
    };

    useEffect(() => {
        if (data !== undefined) {
            setEntriesData(data.result.data);
            if (!values.length) {
                setValues([
                    {
                        modelId: data?.result?.data[0]?.model?.modelId,
                        id: data?.result?.data[0]?.entryId
                    }
                ]);
                setSelectedEntryTitle(data?.result?.data[0]?.title);
            }
        }
    }, [data]);

    useEffect(() => {
        if (!selectedEntryTitle) {
            setSelectedEntryTitle("Select Entry");
        }
    }, [selectedEntryTitle]);

    useEffect(() => {
        if (entries.length) {
            setEntriesData(entries);
        }
    }, [entries, data]);

    useEffect(() => {
        if (entriesData !== undefined) {
            const activeEntity = entriesData.find(({ id }: { id: string }) => id === values[0]?.id);
            setSelectedEntryTitle(activeEntity?.title);
        }
    }, [entriesData]);

    const onDialogClose = useCallback(() => {
        setToggleModal(false);
    }, []);

    const onDialogSave = useCallback(() => {
        const entryId = values.reduce((acc: any, curEntry: any) => curEntry?.id, "0");
        const entryTitle = values.reduce((acc: any, curEntry: any) => curEntry?.title, "");

        updateTemplate({
            templatePageData: { entryId, modelId: templateAtomValue?.sourceModel?.modelId }
        });
        setSelectedEntryTitle(entryTitle);

        onDialogClose();
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
        <EntrySelectorWrapper>
            <div>
                <SelectEntry onClick={() => setToggleModal(true)}>
                    <SelectedEntryLeft>
                        <SelectedEntryLable>Preview entry:</SelectedEntryLable>
                        <SelectedEntryTitle>{selectedEntryTitle}</SelectedEntryTitle>
                    </SelectedEntryLeft>
                    <SelectedEntryRight>
                        <Icon icon={<OpenIcon width={24} height={24} color="#717171" />} />
                    </SelectedEntryRight>
                </SelectEntry>
            </div>
            <EntrySelectorModal
                open={toggleModal}
                onChange={onChange}
                onClose={onDialogClose}
                onSave={onDialogSave}
                onInput={onInput}
                loadMore={loadMore}
                values={values}
                loading={loading}
                entries={entriesData}
                model={templateAtomValue.sourceModel}
            />
        </EntrySelectorWrapper>
    );
};

const EntrySelector = makeComposable("EntrySelector", DefaultEntrySelector);

export const EntrySelectorPlugin = createComponentPlugin(EditorBar.CenterSection, CenterSection => {
    return function AddEntrySelect(props) {
        return (
            <CenterSection>
                {props.children}
                <EntrySelector />
            </CenterSection>
        );
    };
});
