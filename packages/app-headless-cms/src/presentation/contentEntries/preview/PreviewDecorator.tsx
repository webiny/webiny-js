import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryFormContent } from "~/presentation/contentEntries/views/layout/ContentEntryFormContent.js";
import { useContentEntryFormPresenter } from "~/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { PreviewPane } from "./PreviewPane.js";
import { PreviewComponentsProvider } from "./PreviewComponentsContext.js";

export const PreviewDecorator = ContentEntryFormContent.createDecorator(Original => {
    return createReactiveComponent(
        (props: React.HTMLAttributes<HTMLDivElement>) => {
            const presenter = useContentEntryFormPresenter();
            const model = presenter.vm.model;
            const previewUrl = model?.settings?.previewUrl as string | undefined;

            if (!previewUrl) {
                return <Original {...props} />;
            }

            const form = presenter.vm.form;
            const entryData = form ? (form.getData() as Record<string, unknown>) : null;

            return (
                <PreviewComponentsProvider>
                    <div className="grid grid-cols-2 gap-lg h-[calc(100vh-var(--spacing-header)-60px)] px-lg pt-lg">
                        <div className="h-full overflow-hidden">
                            <PreviewPane previewUrl={previewUrl} entryData={entryData} />
                        </div>
                        <div className="h-full overflow-y-auto">
                            <Original {...props} />
                        </div>
                    </div>
                </PreviewComponentsProvider>
            );
        }
    );
});
