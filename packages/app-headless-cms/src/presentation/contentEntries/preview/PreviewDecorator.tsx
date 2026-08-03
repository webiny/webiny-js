import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import {
    SplitView,
    LeftPanel,
    RightPanel
} from "@webiny/app-admin/components/SplitView/SplitView.js";
import { ContentEntryFormContent } from "~/presentation/contentEntries/views/layout/ContentEntryFormContent.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { PreviewPane } from "./PreviewPane.js";

export const PreviewDecorator = ContentEntryFormContent.createDecorator(Original => {
    return createReactiveComponent(
        (props: React.HTMLAttributes<HTMLDivElement> & { width?: string }) => {
            const presenter = useContentEntryFormPresenter();
            const model = presenter.vm.model;
            const previewPrefix = model?.settings?.previewPrefix as string | undefined;
            const previewSlug = model?.settings?.previewSlug as string | undefined;

            if (!previewPrefix) {
                return <Original {...props} />;
            }

            const form = presenter.vm.form;
            const entry = presenter.vm.entry;
            const formValues = form ? form.getData() : null;
            const entryData = formValues
                ? { ...entry, values: formValues as Record<string, unknown> }
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
                            previewPrefix={previewPrefix}
                            previewSlug={previewSlug || ""}
                            entryId={entryId}
                            entryData={entryData}
                        />
                    </RightPanel>
                </SplitView>
            );
        }
    );
});
