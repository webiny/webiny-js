import React, { useCallback, useEffect, useMemo, useState } from "react";
import { BindComponentRenderProp, CmsEditorFieldRendererProps, CmsModel } from "~/types";
import { Options } from "./Options";
import { useReference } from "./useReference";
import { Entry } from "./Entry";
import { ReferencesDialog } from "./ReferencesDialog";
import styled from "@emotion/styled";
import { useQuery } from "~/admin/hooks";
import { ListCmsModelsQueryResponse } from "~/admin/viewsGraphql";
import * as GQL from "~/admin/viewsGraphql";
import { useSnackbar } from "@webiny/app-admin";

const Container = styled("div")({
    borderLeft: "3px solid var(--mdc-theme-background)",
    paddingLeft: "10px"
});

interface Props extends CmsEditorFieldRendererProps {
    bind: BindComponentRenderProp;
}
export const AdvancedReferenceField: React.FC<Props> = props => {
    const { bind, field } = props;
    const { showSnackbar } = useSnackbar();

    const [dialog, setDialog] = useState<boolean>(false);

    const [loadedModels, setLoadedModels] = useState<CmsModel[]>([]);

    const { data, loading } = useQuery<ListCmsModelsQueryResponse>(GQL.LIST_CONTENT_MODELS);

    useEffect(() => {
        if (loading || !data?.listContentModels?.data) {
            return;
        } else if (data.listContentModels.error) {
            setLoadedModels([]);
            showSnackbar(data.listContentModels.error.message);
            return;
        }
        setLoadedModels(data.listContentModels.data);
    }, [data]);

    const onNewRecord = () => {
        setDialog(true);
        return false;
    };
    const onExistingRecord = () => {
        // setDialog(true);
        return false;
    };

    const onDialogClose = useCallback(() => {
        setDialog(false);
    }, []);

    console.log(`dialog: ${dialog}`);

    const ref = useReference({
        value: bind.value
    });

    const { entry } = ref;

    const onRemove = useCallback(() => {
        bind.onChange(null);
    }, [entry]);

    const models = useMemo(() => {
        if (!loadedModels) {
            return [];
        }

        return (field.settings?.models || [])
            .map(({ modelId }) => {
                return loadedModels.find(model => model.modelId === modelId);
            })
            .filter(Boolean) as CmsModel[];
    }, [loadedModels, entry]);

    return (
        <Container>
            <Entry entry={entry} onRemove={onRemove} />
            <Options
                models={models}
                onNewRecord={onNewRecord}
                onLinkExistingRecord={onExistingRecord}
            />
            {dialog && <ReferencesDialog {...props} onDialogClose={onDialogClose} />}
        </Container>
    );
};
