import React from "react";
import { ContentEntries } from "~/admin/views/contentEntries/ContentEntries";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { ContentEntriesProvider } from "~/admin/views/contentEntries/ContentEntriesContext";
import { DialogsProvider } from "@webiny/app-admin";
import { SingletonContentEntryProvider } from "~/admin/views/contentEntries/ContentEntry/SingletonContentEntryContext";
import { SingletonContentEntry } from "~/admin/views/contentEntries/ContentEntry/SingletonContentEntry";
import { useModel } from "~/admin/components/ModelProvider";

const ContentEntriesDecorator = ContentEntries.createDecorator(Original => {
    return function ContentEntries() {
        const { model } = useModel();

        if (model.tags.includes(CMS_MODEL_SINGLETON_TAG)) {
            return (
                <ContentEntriesProvider contentModel={model} key={model.modelId}>
                    <DialogsProvider>
                        <SingletonContentEntryProvider>
                            <SingletonContentEntry />
                        </SingletonContentEntryProvider>
                    </DialogsProvider>
                </ContentEntriesProvider>
            );
        }

        return <Original />;
    };
});

export const SingletonContentEntryModule = () => {
    return (
        <>
            <ContentEntriesDecorator />
        </>
    );
};
