import React, { useState } from "react";
import { CompositionScope, createGenericContext } from "@webiny/app-admin";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms";
import { Prompt } from "@webiny/react-router";
import { ContentEntryGuard } from "./ContentEntryGuard";
import { ContentEntryLocker } from "./ContentEntryLocker";

const { ContentEntry } = ContentEntryEditorConfig;

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
        const { entry } = ContentEntry.useContentEntry();
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
        return (
            <ContentEntryGuard>
                <ContentEntryLocker onDisablePrompt={flag => setDisablePrompt(flag)}>
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
            <CompositionScope name={"cms.contentEntryForm"}>
                <PromptDecorator />
            </CompositionScope>
        </>
    );
};
