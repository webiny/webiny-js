import React, { useEffect } from "react";
import { createDecorator } from "@webiny/app-admin";
import { EditorProvider } from "~/editor";
import { TranslationProvider, useTranslations } from "~/translations/TranslationContext";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { PageEditorEventActionCallableState } from "~/pageEditor/types";
import { ToggleSaveRevisionStateActionEvent } from "~/pageEditor/config/eventActions/saveRevision";
import { EditorConfig } from "~/editor";
import debounce from "lodash/debounce";

const EditorProviderDecorator = createDecorator(EditorProvider, Original => {
    return function EditorProvider(props) {
        return (
            <TranslationProvider>
                <Original {...props} />
            </TranslationProvider>
        );
    };
});

const EventActionHandlers = () => {
    const eventActionHandler = useEventActionHandler<PageEditorEventActionCallableState>();
    const translations = useTranslations();

    const saveTranslations = debounce(() => {
        if (!translations) {
            return;
        }

        console.log("Saving translation", translations.getTranslationItems());
    }, 1000);

    useEffect(() => {
        if (!translations) {
            return;
        }

        const offSaveRevisionAction = eventActionHandler.on(
            ToggleSaveRevisionStateActionEvent,
            createSaveTranslations(saveTranslations)
        );

        return () => {
            offSaveRevisionAction();
        };
    }, []);
    return null;
};

const createSaveTranslations = (cb: () => void) => {
    // @ts-ignore Temp
    return (_, __, meta) => {
        if (meta.saving) {
            cb();
        }

        return {
            actions: []
        };
    };
};

export const TranslationsPageEditorConfig = () => {
    return (
        <>
            <EditorProviderDecorator />
            <EditorConfig>
                <EventActionHandlers />
            </EditorConfig>
        </>
    );
};
