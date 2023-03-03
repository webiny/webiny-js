import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BindComponentRenderProp, CmsEditorFieldRendererProps, CmsModel } from "~/types";
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

const Container = styled("div")({
    borderLeft: "3px solid var(--mdc-theme-background)",
    paddingLeft: "10px"
});

interface Props extends CmsEditorFieldRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue | null>;
}
export const AdvancedSingleReferenceField: React.FC<Props> = props => {
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

    const onRemove = useCallback(() => {
        bind.onChange(null);
    }, [entries]);

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
            if (values.length > 1) {
                console.log("More than one value selected. This should never happen.");
                return;
            } else if (values.length === 0 || !values[0]?.id) {
                bind.onChange(null);
                return;
            }
            bind.onChange(values[0]);
        },
        [bind.value, bind.onChange, entries]
    );

    return (
        <Container>
            {loading && <Loader />}
            {!loadingEntries && <Entry entry={entries[0]} onRemove={onRemove} />}
            <Options
                models={models}
                onNewRecord={onNewRecord}
                onLinkExistingRecord={onExistingRecord}
            />

            {newEntryDialogModel && (
                <NewReferencedEntryDialog
                    model={newEntryDialogModel}
                    onClose={onNewEntryDialogClose}
                    onChange={data => {
                        console.log("New Referenced Entry Dialog");
                        console.log(data);
                    }}
                />
            )}

            {linkEntryDialogModel && (
                <ReferencesDialog
                    {...props}
                    multiple={false}
                    values={bind.value ? [bind.value] : []}
                    contentModel={linkEntryDialogModel}
                    storeValues={storeValues}
                    onDialogClose={onLinkEntryDialogClose}
                />
            )}
        </Container>
    );
};
