import React, { useState } from "react";
import { CompositionScope, createGenericContext } from "@webiny/app-admin";
import { ContentEntryEditorConfig, ContentEntryListConfig } from "@webiny/app-headless-cms";
import { Prompt } from "@webiny/react-router";
import { ContentEntryGuard } from "./ContentEntryGuard";
import { ContentEntryLocker } from "./ContentEntryLocker";

const { ContentEntry, SingletonContentEntry } = ContentEntryEditorConfig;

const DisablePrompt = createGenericContext<{ disablePrompt: boolean }>("DisablePrompt");

const PromptDecorator = Prompt.createDecorator(Original => {
    return function Prompt(props) {
        const { disablePrompt } = DisablePrompt.useHook();
        const when = disablePrompt === true ? false : props.when;
        return <Original message={props.message} when={when} />;
    };
});

const ContentEntryDecorator = ContentEntry.createDecorator(Original => {
    return function RecordLockingContentEntry() {
        const [disablePrompt, setDisablePrompt] = useState(false);
        const { entry, contentModel, loading } = ContentEntry.useContentEntry();
        const { navigateTo } = ContentEntryListConfig.ContentEntries.useContentEntriesList();
        /**
         * New entry does not have ID yet.
         */
        if (!entry?.id) {
            return (
                <DisablePrompt.Provider disablePrompt={disablePrompt}>
                    <Original />
                </DisablePrompt.Provider>
            );
        }
        /**
         * Continue with existing entry.
         */
        const props = { entry, model: contentModel };

        return (
            <ContentEntryGuard {...props} loading={loading}>
                <ContentEntryLocker
                    {...props}
                    onDisablePrompt={flag => setDisablePrompt(flag)}
                    onEntryUnlocked={navigateTo}
                >
                    <DisablePrompt.Provider disablePrompt={disablePrompt}>
                        <Original />
                    </DisablePrompt.Provider>
                </ContentEntryLocker>
            </ContentEntryGuard>
        );
    };
});

const SingletonContentEntryDecorator = SingletonContentEntry.createDecorator(Original => {
    return function RecordLockingSingletonContentEntry() {
        const [disablePrompt, setDisablePrompt] = useState(false);
        const { entry, contentModel, loading } = SingletonContentEntry.useSingletonContentEntry();

        const props = { entry, model: contentModel };

        return (
            <ContentEntryGuard {...props} loading={loading}>
                <ContentEntryLocker
                    {...props}
                    onDisablePrompt={flag => setDisablePrompt(flag)}
                    onEntryUnlocked={() => {
                        // There's nowhere to go, since singleton entry doesn't have a list view.
                    }}
                >
                    <DisablePrompt.Provider disablePrompt={disablePrompt}>
                        <Original />
                    </DisablePrompt.Provider>
                </ContentEntryLocker>
            </ContentEntryGuard>
        );
    };
});

export const HeadlessCmsContentEntry = () => {
    return (
        <>
            <ContentEntryDecorator />
            <SingletonContentEntryDecorator />
            <CompositionScope name={"cms.contentEntryForm"}>
                <PromptDecorator />
            </CompositionScope>
        </>
    );
};
