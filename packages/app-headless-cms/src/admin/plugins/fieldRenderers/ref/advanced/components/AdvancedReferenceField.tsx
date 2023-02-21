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

const Container = styled("div")({
    borderLeft: "3px solid var(--mdc-theme-background)",
    paddingLeft: "10px"
});

interface Props extends CmsEditorFieldRendererProps {
    bind: BindComponentRenderProp<CmsReferenceValue | null>;
}
export const AdvancedReferenceField: React.FC<Props> = props => {
    const { bind, field } = props;
    const { showSnackbar } = useSnackbar();

    const [linkEntryDialogModel, setLinkEntryDialogModel] = useState<CmsModel | null>(null);
    const [newEntryDialog, setNewEntryDialogModel] = useState<CmsModel | null>(null);

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

    const reference = useReference({
        value: bind.value
    });

    const { entry, loading: loadingEntry } = reference;

    const onRemove = useCallback(() => {
        bind.onChange(null);
    }, [entry]);

    const models = useMemo(() => {
        if (!loadedModels || !entry) {
            return [];
        }

        return (field.settings?.models || [])
            .map(({ modelId }) => {
                return loadedModels.find(model => model.modelId === modelId);
            })
            .filter(Boolean) as CmsModel[];
    }, [loadedModels, entry]);

    const loading = loadingEntry || loadingModels;

    const selectedEntries = useMemo(() => {
        if (!bind.value?.id) {
            return [];
        }
        return [bind.value.id];
    }, [bind.value]);

    const storeValue = useCallback(
        (value: CmsReferenceValue | null) => {
            bind.onChange(value);
        },
        [bind.value, bind.onChange, entry]
    );

    return (
        <Container>
            {loading && <Loader />}
            {!loadingEntry && <Entry entry={entry} onRemove={onRemove} />}
            <Options
                models={models}
                onNewRecord={onNewRecord}
                onLinkExistingRecord={onExistingRecord}
            />

            {linkEntryDialogModel && (
                <ReferencesDialog
                    {...props}
                    value={bind.value}
                    entry={entry}
                    contentModel={linkEntryDialogModel}
                    storeValue={storeValue}
                    onDialogClose={onLinkEntryDialogClose}
                />
            )}
        </Container>
    );
};
