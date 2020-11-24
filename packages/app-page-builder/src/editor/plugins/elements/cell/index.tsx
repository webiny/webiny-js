import React from "react";
import CellContainer from "./CellContainer";
import { executeAction } from "@webiny/app-page-builder/editor/recoil/eventActions";
import { UpdateElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/updateElement/types";
import {
    CreateElementActionEvent,
    DeleteElementActionEvent,
    updateElementAction
} from "@webiny/app-page-builder/editor/recoil/actions";
import {
    addElementToParentHelper,
    createDroppedElementHelper,
    createElementHelper,
    createEmptyElementHelper
} from "@webiny/app-page-builder/editor/helpers";
import {
    PbEditorPageElementPlugin,
    PbEditorPageElementSaveActionPlugin,
    PbElement
} from "@webiny/app-page-builder/types";
import { Plugin } from "@webiny/plugins/types";

const cellPlugin: PbEditorPageElementPlugin = {
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
    create: (options = {}) => {
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
                    grid: {
                        size: options.data?.settings?.grid?.size || 1
                    }
                }
            }
        };
    },
    onReceived({ source, position, target, state, meta }) {
        const { element, dispatchCreateElementAction = false } = createDroppedElementHelper(
            source as any,
            target
        );
        const parent = addElementToParentHelper(element, target, position);

        const result = executeAction<UpdateElementActionArgsType>(
            state,
            meta,
            updateElementAction,
            {
                element: parent
            }
        );

        // if source has path it means that source is a PbElement or similar
        // so we can use path and id from the source to represent the element
        // and execute the delete element action
        if (source.path) {
            result.actions.push(
                new DeleteElementActionEvent({
                    element: createEmptyElementHelper({
                        id: source.id as string,
                        path: source.path as string,
                        type: source.type
                    })
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
// this is required because when saving cell element it cannot be without grid element
const saveActionPlugin = {
    type: "pb-editor-page-element-save-action",
    name: "pb-editor-page-element-save-action-cell",
    elementType: "cell",
    onSave(element) {
        return createElementHelper("grid", {
            data: {
                settings: {
                    grid: {
                        cellsType: "12"
                    }
                }
            },
            elements: [
                {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...element.data.settings,
                            grid: {
                                size: "12"
                            }
                        }
                    }
                }
            ]
        });
    }
} as PbEditorPageElementSaveActionPlugin;

export default (): Plugin[] => [cellPlugin, saveActionPlugin];
