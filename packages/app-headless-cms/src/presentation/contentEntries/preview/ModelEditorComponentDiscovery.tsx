import React from "react";
import { ContentModelEditor } from "~/admin/components/ContentModelEditor/ContentModelEditor.js";
import { useModelEditor } from "~/admin/components/ContentModelEditor/useModelEditor.js";
import { PreviewComponentsProvider } from "./PreviewComponentsContext.js";
import { ComponentDiscoveryIframe } from "./ComponentDiscoveryIframe.js";

export const ModelEditorComponentDiscovery = ContentModelEditor.createDecorator(Original => {
    return function ModelEditorWithDiscovery() {
        const { data } = useModelEditor();
        const previewUrl = data?.settings?.previewUrl as string | undefined;

        return (
            <PreviewComponentsProvider>
                {previewUrl ? <ComponentDiscoveryIframe previewUrl={previewUrl} /> : null}
                <Original />
            </PreviewComponentsProvider>
        );
    };
});
