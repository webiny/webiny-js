import React, { useMemo } from "react";
import { makeDecoratable } from "@webiny/app-admin";
import type { CmsContentEntry, CmsEditorContentModel } from "~/types.js";
import { ModelProvider } from "~/admin/components/ModelProvider/index.js";
import { useFormRenderer } from "~/admin/components/ContentEntryForm/useFormRenderer.js";
import { CustomLayout } from "~/admin/components/ContentEntryForm/CustomLayout.js";
import { DefaultLayout } from "~/admin/components/ContentEntryForm/DefaultLayout.js";
import { ContentEntryFormProvider } from "./ContentEntryFormProvider.js";

export interface ContentEntryFormPreviewProps {
    contentModel: CmsEditorContentModel;
}

const baseEntry: Pick<CmsContentEntry, "values"> = {
    values: {}
};

export const ContentEntryFormPreview = makeDecoratable(
    "ContentEntryFormPreview",
    (props: ContentEntryFormPreviewProps) => {
        const { contentModel } = props;

        const formRenderer = useFormRenderer(contentModel);
        
        const initialEntry = useMemo(() => {
            return baseEntry;
        }, []);
        

        return (
            <ContentEntryFormProvider
                entry={initialEntry}
                model={contentModel}
                persistEntry={async entry => {
                    return {
                        entry: entry as CmsContentEntry
                    };
                }}
                confirmNavigationIfDirty={false}
            >
                <ModelProvider model={contentModel}>
                    <div
                        className={"h-calc(100vh-260px) overflow-auto"}
                        data-testid={"cms-content-form"}
                    >
                        {formRenderer ? (
                            <CustomLayout model={contentModel} formRenderer={formRenderer} />
                        ) : (
                            <DefaultLayout model={contentModel} />
                        )}
                    </div>
                </ModelProvider>
            </ContentEntryFormProvider>
        );
    }
);
