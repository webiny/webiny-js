import React, { useEffect } from "react";
import { ContentModelEditor } from "~/admin/components/ContentModelEditor/ContentModelEditor.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import { usePreviewDomain } from "@webiny/frontend-settings/exports/admin";
import { ComponentDiscoveryIframe } from "./ComponentDiscoveryIframe.js";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";

export const ModelEditorComponentDiscovery = ContentModelEditor.createDecorator(Original => {
    return function ModelEditorWithDiscovery() {
        const { data } = useModelEditor();
        const presenter = useLivePreviewPresenter();
        const previewPath = data?.settings?.previewPath as string | undefined;
        const { previewDomain } = usePreviewDomain();

        useEffect(() => {
            if (!previewPath) {
                presenter.clearComponents();
            }
        }, [previewPath, presenter]);

        useEffect(() => {
            return () => {
                presenter.clearComponents();
            };
        }, [presenter]);

        return (
            <>
                {previewPath ? <ComponentDiscoveryIframe domain={previewDomain} /> : null}
                <Original />
            </>
        );
    };
});
