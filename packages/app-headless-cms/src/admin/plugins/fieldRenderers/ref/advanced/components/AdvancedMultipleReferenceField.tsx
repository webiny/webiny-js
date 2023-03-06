import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    BindComponentRenderProp,
    CmsEditorContentEntry,
    CmsEditorFieldRendererProps,
    CmsModel
} from "~/types";
import { Options } from "./Options";
import { useReference } from "../hooks/useReference";
import { Entry } from "./Entry";
import { ReferencesDialog } from "./ReferencesDialog";
import styled from "@emotion/styled";
import { useQuery } from "~/admin/hooks";
import { ListCmsModelsQueryResponse } from "~/admin/viewsGraphql";
import * as GQL from "~/admin/viewsGraphql";
import { useSnackbar } from "@webiny/app-admin";
import { CmsReferenceValue } from "~/admin/plugins/fieldRenderers/ref/components/types";
import { Loader } from "./Loader";
import { NewReferencedEntryDialog } from "~/admin/plugins/fieldRenderers/ref/advanced/components/NewReferencedEntryDialog";
import { parseIdentifier } from "@webiny/utils";

const Container = styled("div")({
    borderLeft: "3px solid var(--mdc-theme-background)",
    paddingLeft: "10px"
});

interface Props extends CmsEditorFieldRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue | null>;
}
export const AdvancedMultipleReferenceField: React.FC<Props> = props => {
    const { bind, field } = props;
    const { showSnackbar } = useSnackbar();

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

    const { entries, loading: loadingEntries } = useReference({
        values: bind.value
    });

    const onRemove = useCallback(
        (id: string) => {
            if (!bind.value || !Array.isArray(bind.value)) {
                return;
            }
            const { id: entryId } = parseIdentifier(id);
            bind.onChange(
                bind.value.filter(value => {
                    const { id: valueEntryId } = parseIdentifier(value.id);
                    return valueEntryId !== entryId;
                })
            );
        },
        [entries, bind.value]
    );

    const models = useMemo(() => {
        if (!loadedModels || !field.settings?.models) {
            return [];
        }

        return (field.settings?.models || [])
            .map(({ modelId }) => {
                return loadedModels.find(model => model.modelId === modelId);
            })
            .filter(Boolean) as CmsModel[];
    }, [loadedModels, entries]);

    const loading = loadingEntries || loadingModels;

    const storeValues = useCallback(
        (values: CmsReferenceValue[]) => {
            bind.onChange(values);
        },
        [bind.value, bind.onChange, entries]
    );

    const onNewEntryCreate = useCallback(
        (data: CmsEditorContentEntry | null) => {
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
            storeValues([
                {
                    id: data.id,
                    modelId: data.modelId
                }
            ]);
        },
        [storeValues]
    );

    return (
        <Container>
            {loading && <Loader />}
            {!loadingEntries &&
                entries.map(entry => {
                    return (
                        <Entry
                            key={`reference-entry-${entry.id}`}
                            entry={entry}
                            onRemove={onRemove}
                        />
                    );
                })}
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
                    values={(bind.value as unknown as CmsReferenceValue[]) || []}
                    contentModel={linkEntryDialogModel}
                    storeValues={storeValues}
                    onDialogClose={onLinkEntryDialogClose}
                />
            )}
        </Container>
    );
};
