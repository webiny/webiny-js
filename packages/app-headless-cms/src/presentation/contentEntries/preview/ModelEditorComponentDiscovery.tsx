import React, { useEffect } from "react";
import { ContentModelEditor } from "~/admin/components/ContentModelEditor/ContentModelEditor.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import { ComponentDiscoveryIframe } from "./ComponentDiscoveryIframe.js";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";

export const ModelEditorComponentDiscovery = ContentModelEditor.createDecorator(Original => {
    return function ModelEditorWithDiscovery() {
        const { data } = useModelEditor();
        const presenter = useLivePreviewPresenter();
        const previewUrl = data?.settings?.previewUrl as string | undefined;

        useEffect(() => {
            if (!previewUrl) {
                presenter.clearComponents();
            }
        }, [previewUrl, presenter]);

        useEffect(() => {
            return () => {
                presenter.clearComponents();
            };
        }, [presenter]);

        return (
            <>
                {previewUrl ? <ComponentDiscoveryIframe previewUrl={previewUrl} /> : null}
                <Original />
            </>
        );
    };
});
