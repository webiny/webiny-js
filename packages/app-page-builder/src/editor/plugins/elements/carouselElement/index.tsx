import React from "react";
import kebabCase from "lodash/kebabCase";
import { createInitialPerDeviceSettingValue } from "~/editor/plugins/elementSettings/elementSettingsUtils";
import {
    CreateElementActionEvent,
    DeleteElementActionEvent,
    updateElementAction,
    UpdateElementActionArgsType
} from "~/editor/recoil/actions";
import CarouselElement from "./CarouselElement";
import { addElementToParent, createDroppedElement, createElement } from "~/editor/helpers";
import { AfterDropElementActionEvent } from "~/editor/recoil/actions/afterDropElement";
import { executeAction } from "~/editor/recoil/eventActions";
import {
    PbEditorPageElementPlugin,
    PbEditorElementPluginArgs,
    DisplayMode,
    PbEditorElement
} from "~/types";

export default (args: PbEditorElementPluginArgs = {}): PbEditorPageElementPlugin => {
    const defaultSettings = [
        "pb-editor-page-element-style-settings-carousel-element",
        "pb-editor-page-element-style-settings-background",
        "pb-editor-page-element-style-settings-animation",
        "pb-editor-page-element-style-settings-border",
        "pb-editor-page-element-style-settings-shadow",
        "pb-editor-page-element-style-settings-padding",
        "pb-editor-page-element-style-settings-margin",
        "pb-editor-page-element-style-settings-width",
        "pb-editor-page-element-style-settings-height",
        "pb-editor-page-element-settings-clone",
        "pb-editor-page-element-settings-delete"
    ];

    const elementType = kebabCase(args.elementType || "carousel-element");

    return {
        type: "pb-editor-page-element",
        name: `pb-editor-page-element-${elementType}`,
        elementType: elementType,
        settings:
            typeof args.settings === "function" ? args.settings(defaultSettings) : defaultSettings,
        canDelete: () => {
            return false;
        },
        create: () => {
            const defaultValue = {
                type: elementType,
                elements: [createElement("grid")],
                data: {
                    settings: {
                        carouselElement: {
                            label: "Carousel Element Label"
                        },
                        padding: createInitialPerDeviceSettingValue(
                            { all: "10px" },
                            DisplayMode.DESKTOP
                        )
                    }
                }
            };

            return typeof args.create === "function" ? args.create(defaultValue) : defaultValue;
        },
        render(props) {
            return <CarouselElement {...props} />;
        },
        onReceived({ source, target, position, state, meta }) {
            const element = createDroppedElement(source as any, target);

            const block = addElementToParent(element, target, position);

            const result = executeAction<UpdateElementActionArgsType>(
                state,
                meta,
                updateElementAction,
                {
                    element: block,
                    history: true
                }
            );

            result.actions.push(
                new AfterDropElementActionEvent({
                    element
                })
            );

            if (source.id) {
                // Delete source element
                result.actions.push(
                    new DeleteElementActionEvent({
                        element: source as PbEditorElement
                    })
                );

                return result;
            }

            result.actions.push(
                new CreateElementActionEvent({
                    element,
                    source: source as PbEditorElement
                })
            );
            return result;
        },
        canReceiveChildren: true
    };
};
