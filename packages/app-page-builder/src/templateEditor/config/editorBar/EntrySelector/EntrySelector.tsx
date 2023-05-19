import React, { useEffect, useState, useCallback, useRef } from "react";
import { createComponentPlugin, makeComposable } from "@webiny/app-admin";
import { merge } from "dot-prop-immutable";
import styled from "@emotion/styled";
import { EditorBar } from "~/editor";
import { useTemplate } from "~/templateEditor/hooks/useTemplate";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { EntrySelectorModal } from "./EntrySelectorModal";
import { Icon } from "@webiny/ui/Icon";
import { ReactComponent as OpenIcon } from "@material-symbols/svg-400/rounded/open_in_new-fill.svg";
import gql from "graphql-tag";

import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { useEntries } from "@webiny/app-headless-cms/admin/plugins/fieldRenderers/ref/advanced/hooks/useEntries";

const GET_MODEL_ENTRIES = gql`
    query searchContentEntities(
        $modelIds: [ID!]!
        $query: String
        $fields: [String!]
        $limit: Int
    ) {
        result: searchContentEntries(
            modelIds: $modelIds
            query: $query
            fields: $fields
            limit: $limit
        ) {
            data {
                id
                entryId
                status
                title
                description
                image
                createdOn
                savedOn
                createdBy {
                    id
                    type
                    displayName
                }
                modifiedBy {
                    id
                    type
                    displayName
                }
                model {
                    modelId
                    name
                }
                published {
                    id
                    entryId
                    title
                }
            }
            error {
                code
                message
                data
            }
        }
    }
`;

const SelectEntry = styled.div`
    width: 400px;
    height: 25px;

    margin-left: 15px;
    padding: 10px 13px;

    cursor: pointer;

    background-color: #e6e6e6;
    opacity: 0.5;

    display: flex;
    justify-content: space-between;
    align-items: center;

    position: absolute;
    top: 10px;
`;

const SelectedEntryTitle = styled.span`
    font-weight: 400;
    font-size: 14px;
    line-height: 18px;
    color: #000000;
`;

const SelectedEntryLable = styled.span`
    font-weight: 400;
    font-size: 12px;
    line-height: 15px;
    color: #4b4b4b;
`;

const SelectedEntryLeft = styled.div`
    display: flex;
    flex-direction: column;
`;

const SelectedEntryRight = styled.div``;

// TODO: types, improve useEffects, change values state to object instead of array, fix loadMore
const DefaultEntrySelector = () => {
    const [templateAtomValue] = useTemplate();
    const handler = useEventActionHandler();
    const { data, loading } = useQuery(GET_MODEL_ENTRIES, {
        variables: {
            modelIds: [templateAtomValue?.sourceModel?.modelId]
        }
    });

    const defaultValues = templateAtomValue?.templatePageData
        ? [
              {
                  id: templateAtomValue?.templatePageData?.entryId,
                  modelId: templateAtomValue?.templatePageData?.modelId
              }
          ]
        : [];

    const [toggleModal, setToggleModal] = useState<boolean>(false);
    const [selectedEntryTitle, setSelectedEntryTitle] = useState("Select Entry");
    const [entriesData, setEntriesData] = useState<any>();

    const [values, setValues] = useState<any>(defaultValues);

    const {
        entries,
        runSearch,
        loadMore: __loadMore
    } = useEntries({
        model: templateAtomValue?.sourceModel as any,
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

    const loadMore = useCallback(() => {}, []);

    return (
        <>
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
            />
        </>
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
