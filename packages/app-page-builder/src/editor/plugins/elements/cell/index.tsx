import React from "react";
import CellContainer from "./CellContainer";
import {
    CreateElementActionEvent,
    DeleteElementActionEvent,
    updateElementAction
} from "@webiny/app-page-builder/editor/recoil/actions";
import { EventActionHandlerActionCallableResponseType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    addElementToParentHelper,
    createDroppedElementHelper
} from "@webiny/app-page-builder/editor/recoil/helpers";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";

const plugin: PbEditorPageElementPlugin = {
    type: "pb-editor-page-element",
    name: "pb-editor-page-element-cell",
    elementType: "cell",
    settings: [
        "pb-editor-page-element-settings-background",
        "pb-editor-page-element-settings-animation",
        "",
        "pb-editor-page-element-settings-border",
        "pb-editor-page-element-settings-shadow",
        "",
        "pb-editor-page-element-settings-padding",
        "pb-editor-page-element-settings-margin",
        ""
    ],
    canDelete: () => {
        return false;
    },
    create: options => {
        return {
            type: "cell",
            elements: [],
            data: {
                settings: {
                    margin: {
                        mobile: { top: 15, left: 15, right: 15, bottom: 15 },
                        desktop: { top: 25, left: 0, right: 0, bottom: 25 },
                        advanced: true
                    },
                    padding: {
                        mobile: { all: 10 },
                        desktop: { all: 0 }
                    },
                    size: options.data?.settings?.size || 1
                }
            }
        };
    },
    onReceived({ source, position, target, state }) {
        const { element, dispatchCreateElementAction = false } = createDroppedElementHelper(
            source as any,
            target
        );
        const parent = addElementToParentHelper(element, target, position);

        const result = updateElementAction(state, {
            element: parent
        }) as EventActionHandlerActionCallableResponseType;
        // if source has path it means that source is a PbElement or similar
        // so we can use path and id from the source to represent the element
        // and execute the delete element action
        if (source.path) {
            result.actions.push(
                new DeleteElementActionEvent({
                    element: {
                        id: source.id as string,
                        path: source.path as string,
                        type: source.type,
                        elements: [],
                        data: {}
                    }
                })
            );
        }
        // at this point we think we know source is PbElement
        // so we can dispatch create element action to be ran after this
        if (!dispatchCreateElementAction) {
            return result;
        }
        result.actions.push(
            new CreateElementActionEvent({
                element,
                source: source as PbElement
            })
        );

        return result;
    },
    render(props) {
        return <CellContainer {...props} elementId={props.element.id} />;
    }
};

export default () => plugin;
