import React, { useEffect } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import {
    SplitView,
    LeftPanel,
    RightPanel
} from "@webiny/app-admin/components/SplitView/SplitView.js";
import { usePreviewDomain } from "@webiny/frontend-settings/exports/admin.js";
import { ContentEntryFormContent } from "~/presentation/contentEntries/views/layout/ContentEntryFormContent.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { PreviewPane } from "./PreviewPane.js";
import { useLivePreviewPresenter } from "./useLivePreviewPresenter.js";
import { getPatternRefFieldIds, getRefValues, withRefValues } from "./resolvePreviewUrl.js";

export const PreviewDecorator = ContentEntryFormContent.createDecorator(Original => {
    return createReactiveComponent(
        (props: React.HTMLAttributes<HTMLDivElement> & { width?: string }) => {
            const presenter = useContentEntryFormPresenter();
            const livePreview = useLivePreviewPresenter();
            const model = presenter.vm.model;
            const previewPath = model?.settings?.previewPath as string | undefined;
            const { previewDomain } = usePreviewDomain();

            const form = presenter.vm.form;
            const entry = presenter.vm.entry;
            const formValues = form ? (form.getData() as Record<string, unknown>) : null;
            const entryData = formValues ? { ...entry, values: formValues } : null;

            const refFieldIds =
                previewPath && model ? getPatternRefFieldIds(previewPath, model.fields) : [];
            const refs = formValues ? getRefValues(formValues, refFieldIds) : [];
            const refsKey = refs.map(ref => ref.id).join(",");

            useEffect(() => {
                if (refs.length > 0) {
                    livePreview.loadRefValues(refs);
                }
            }, [refsKey]);

            if (!previewPath) {
                return <Original {...props} />;
            }

            // Only the preview URL gets the referenced values; the iframe receives the raw form data.
            const urlEntryData = entryData
                ? withRefValues(entryData, refFieldIds, livePreview.vm.refValues)
                : null;

            const entryId = entry?.id || "new";

            return (
                <SplitView namespace={"cms-live-preview"} className="h-full">
                    <LeftPanel span={5} minSize={20} className="bg-white overflow-y-auto">
                        <Original
                            {...props}
                            width={"100%"}
                            className={"!pt-0 [&>div]:!rounded-none"}
                        />
                    </LeftPanel>
                    <RightPanel
                        span={7}
                        minSize={20}
                        className="overflow-hidden p-md"
                        style={{ overflowY: "hidden" }}
                    >
                        <PreviewPane
                            domain={previewDomain}
                            previewPath={previewPath}
                            entryId={entryId}
                            entryData={entryData}
                            urlEntryData={urlEntryData}
                        />
                    </RightPanel>
                </SplitView>
            );
        }
    );
});
