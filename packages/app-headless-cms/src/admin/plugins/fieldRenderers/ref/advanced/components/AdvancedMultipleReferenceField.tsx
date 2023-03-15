import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "@emotion/styled";
import * as GQL from "~/admin/viewsGraphql";
import {
    BindComponentRenderProp,
    CmsEditorContentEntry,
    CmsEditorFieldRendererProps,
    CmsModel
} from "~/types";
import { Options } from "./Options";
import { useReferences } from "../hooks/useReferences";
import { Entry } from "./Entry";
import { ReferencesDialog } from "./ReferencesDialog";
import { useQuery } from "~/admin/hooks";
import { ListCmsModelsQueryResponse } from "~/admin/viewsGraphql";
import { useSnackbar } from "@webiny/app-admin";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { AbsoluteLoader as Loader } from "./Loader";
import { NewReferencedEntryDialog } from "../components/NewReferencedEntryDialog";
import { parseIdentifier } from "@webiny/utils";
import { Entries } from "./Entries";

const FieldLabel = styled("h3")({
    fontSize: 24,
    fontWeight: "normal",
    borderBottom: "1px solid var(--mdc-theme-background)",
    marginBottom: "20px",
    paddingBottom: "5px",
    display: 'flex',
    justifyContent: 'space-between'
});

const OptionsContainer: any= styled('div')({
    borderTop: "1px solid var(--mdc-theme-on-background)",
    borderRight: "1px solid var(--mdc-theme-surface)",
    backgroundColor: "var(--mdc-theme-surface)",
    marginLeft: '-21px',
    marginBottom: '-21px',
    marginRight: '-1px'
})

const Container = styled("div")({
    border: "1px solid var(--mdc-theme-on-background)",
    paddingLeft: "10px",
    width: "100%",
    boxSizing: "border-box",
    position: "relative",
    padding: '20px 0 20px 20px',
    backgroundColor: "var(--mdc-theme-background)",
    '&.no-entries':{
        backgroundColor: "var(--mdc-theme-surface)",
        border: 'none',
        borderLeft: "3px solid var(--mdc-theme-background)",
        padding: 0,
        paddingLeft: 10,
        [OptionsContainer]:{
            border: 'none',
            margin: 0
        }
    }
});

const FieldName = styled('span')({});
const RecordCount = styled('span')({
    color: "var(--mdc-theme-text-secondary-on-background)",
    fontSize: '0.6em',
    lineHeight: '100%',
    alignSelf: 'center'
});

interface Props extends CmsEditorFieldRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue[] | undefined | null>;
}

export const AdvancedMultipleReferenceField: React.VFC<Props> = props => {
    const { bind, field } = props;
    const { showSnackbar } = useSnackbar();

    const values = useMemo(() => {
        return bind.value || [];
    }, [bind.value]);

    const [linkEntryDialogModel, setLinkEntryDialogModel] = useState<CmsModel | null>(null);
    const [newEntryDialogModel, setNewEntryDialogModel] = useState<CmsModel | null>(null);

    const [loadedModels, setLoadedModels] = useState<CmsModel[]>([]);

    const { data, loading: loadingModels } = useQuery<ListCmsModelsQueryResponse>(
        GQL.LIST_CONTENT_MODELS
    );

    useEffect(() => {
        if (loadingModels || !data?.listContentModels?.data) {
            return;
        } else if (data.listContentModels.error) {
            setLoadedModels([]);
            showSnackbar(data.listContentModels.error.message);
            return;
        }
        setLoadedModels(data.listContentModels.data);
    }, [data]);

    const onNewRecord = useCallback(
        (modelId: string) => {
            const model = loadedModels.find(model => model.modelId === modelId);
            if (!model) {
                console.log(`Cannot find model by modelId "${modelId}".`);
                return;
            }
            setNewEntryDialogModel(model);
        },
        [loadedModels, linkEntryDialogModel]
    );

    const onNewEntryDialogClose = useCallback(() => {
        setNewEntryDialogModel(null);
    }, [linkEntryDialogModel]);

    const onExistingRecord = useCallback(
        (modelId: string) => {
            const model = loadedModels.find(model => model.modelId === modelId);
            if (!model) {
                console.log(`Cannot find model by modelId "${modelId}".`);
                return;
            }
            setLinkEntryDialogModel(model);
        },
        [loadedModels, linkEntryDialogModel]
    );

    const onLinkEntryDialogClose = useCallback(() => {
        setLinkEntryDialogModel(null);
    }, []);

    const {
        entries,
        loading: loadingEntries,
        loadMore
    } = useReferences({
        values,
        perPage: 10
    });

    const onRemove = useCallback(
        (id: string) => {
            if (!values || !Array.isArray(values)) {
                return;
            }
            const { id: entryId } = parseIdentifier(id);
            bind.onChange(
                values.filter(value => {
                    const { id: valueEntryId } = parseIdentifier(value.id);
                    return valueEntryId !== entryId;
                })
            );
        },
        [entries, values]
    );

    const models = useMemo(() => {
        if (!loadedModels || !field.settings?.models || !Array.isArray(field.settings.models)) {
            return [];
        }

        return field.settings.models.reduce<CmsModel[]>((collection, ref) => {
            const model = loadedModels.find(model => model.modelId === ref.modelId);
            if (!model) {
                return collection;
            }
            collection.push(model);

            return collection;
        }, []);
    }, [loadedModels, entries]);

    const storeValues = useCallback(
        (values: CmsReferenceValue[]) => {
            bind.onChange(values);
            return;
        },
        [values]
    );

    const onNewEntryCreate = useCallback(
        (data: Partial<CmsEditorContentEntry> | null) => {
            if (!data) {
                console.log(
                    `Could not store new entry to the reference field. Missing whole entry.`
                );
                return;
            } else if (!data.id) {
                console.log(
                    `Could not store new entry to the reference field. Missing "id" value.`
                );
                return;
            } else if (!data.modelId) {
                console.log(
                    `Could not store new entry to the reference field. Missing "modelId" value.`
                );
                return;
            }
            storeValues(
                values.concat([
                    {
                        id: data.id,
                        modelId: data.modelId
                    }
                ])
            );
        },
        [storeValues]
    );

    const onMoveUp = useCallback(
        (index: number, toTop?: boolean) => {
            if (values.length === 0) {
                return;
            } else if (toTop) {
                const arr = values.splice(index, 1);
                bind.onChange(arr.concat(values));
                return;
            }
            bind.moveValueUp(index);
        },
        [values]
    );
    const onMoveDown = useCallback(
        (index: number, toBottom?: boolean) => {
            if (values.length === 0) {
                return;
            } else if (toBottom === true) {
                const arr = values.splice(index, 1);
                bind.onChange(values.concat(arr));
                return;
            }
            bind.moveValueDown(index);
        },
        [values]
    );

    const loading = loadingEntries || loadingModels;

    let message = 'no records selected';
    if(values.length>0){
        message = "1 record selected";
        if(values.length>1){
            message = values.length+" records selected";
        }
    }

    return (
        <>
            <FieldLabel>
                <FieldName>{field.label}</FieldName> 
                <RecordCount>({message})</RecordCount>
            </FieldLabel>
            <Container className={(entries.length<1 ? 'no-entries' : 'has-entries')}>
                {loading && <Loader />}
                <Entries entries={entries} loadMore={loadMore}>
                    {(entry, index) => {
                        const isFirst = index === 0;
                        const isLast = index >= values.length - 1;
                        return (
                            <Entry
                                key={`reference-entry-${entry.id}`}
                                index={index}
                                entry={entry}
                                onRemove={onRemove}
                                onMoveUp={!isFirst ? onMoveUp : undefined}
                                onMoveDown={!isLast ? onMoveDown : undefined}
                            />
                        );
                    }}
                </Entries>

                <OptionsContainer>
                    <Options
                        models={models}
                        onNewRecord={onNewRecord}
                        onLinkExistingRecord={onExistingRecord}
                    />

                    {newEntryDialogModel && (
                        <NewReferencedEntryDialog
                            model={newEntryDialogModel}
                            onClose={onNewEntryDialogClose}
                            onChange={onNewEntryCreate}
                        />
                    )}

                    {linkEntryDialogModel && (
                        <ReferencesDialog
                            {...props}
                            multiple={true}
                            values={values}
                            contentModel={linkEntryDialogModel}
                            storeValues={storeValues}
                            onDialogClose={onLinkEntryDialogClose}
                        />
                    )}
                </OptionsContainer>
            </Container>
        </>
    );
};
