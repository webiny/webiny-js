import React, { useEffect, useState } from "react";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { saveTemplateAction, SaveTemplateActionEvent } from "./saveTemplate";
import { UpdateDocumentActionEvent } from "~/editor/recoil/actions";
import { TemplateEditorEventActionCallableState } from "~/templateEditor/types";
import { Prompt } from "@webiny/react-router";

export const EventActionHandlers = () => {
    const eventActionHandler = useEventActionHandler<TemplateEditorEventActionCallableState>();
    const [isDirty, setDirty] = useState(false);

    useEffect(() => {
        const offSaveTemplateAction = eventActionHandler.on(SaveTemplateActionEvent, (...args) => {
            setDirty(false);
            return saveTemplateAction(...args);
        });

        const offUpdateTemplateAction = eventActionHandler.on(
            UpdateDocumentActionEvent,
            async (state, _, args) => {
                setDirty(true);
                return {
                    state: {
                        template: {
                            ...state.template,
                            ...(args?.document || {})
                        }
                    },
                    actions: []
                };
            }
        );

        return () => {
            offSaveTemplateAction();
            offUpdateTemplateAction();
        };
    }, []);

    return (
        <Prompt
            when={isDirty}
            message="There are some unsaved changes! Are you sure you want to navigate away and discard all changes?"
        />
    );
};
