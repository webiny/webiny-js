import { DragObjectWithTypeWithTargetType } from "@webiny/app-page-builder/editor/components/Droppable";
import {
    CreateElementActionEvent,
    DeleteElementActionEvent,
    updateElementAction
} from "@webiny/app-page-builder/editor/recoil/actions";
import { EventActionHandlerActionCallableResponseType } from "@webiny/app-page-builder/editor/recoil/eventActions";
import {
    addElementToParentHelper,
    cloneElementHelper,
    createElementHelper
} from "@webiny/app-page-builder/editor/recoil/helpers";
import React from "react";
import { PbEditorPageElementPlugin, PbElement } from "@webiny/app-page-builder/types";
import Cell from "./Cell";

const createDroppedElement = (
    source: DragObjectWithTypeWithTargetType,
    target: PbElement
): { element: PbElement; dispatchCreateElementAction?: boolean } => {
    if (source.path) {
        return {
            element: cloneElementHelper({
                id: source.id,
                path: source.path,
                type: source.type as string,
                elements: (source as any).elements || [],
                data: (source as any).data || {}
            })
        };
    }
    return {
        element: createElementHelper(source.type, {}, target),
        dispatchCreateElementAction: true
    };
};

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
        const { element, dispatchCreateElementAction = false } = createDroppedElement(
            source as any,
            target
        );
        const parent = addElementToParentHelper(element, target, position);

        const { state: stateResult, actions } = updateElementAction(state, {
            element: parent
        }) as EventActionHandlerActionCallableResponseType;
        // if source has path it means that source is a PbElement or similar
        // so we can use path and id from the source to represent the element
        // and execute the delete element action
        if (source.path) {
            actions.push(
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
        if (dispatchCreateElementAction) {
            actions.push(
                new CreateElementActionEvent({
                    element,
                    source: source as PbElement
                })
            );
        }
        console.log({ state: stateResult, actions });

        return {
            state: stateResult,
            actions
        };
    },
    render(props) {
        return <Cell {...props} elementId={props.element.id} />;
    }
};

export default () => plugin;
