import React from "react";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";

import { DroppableElement1 } from "./DroppableElement1";

export default [
    {
        name: "pb-editor-page-element-droppable-element-1",
        type: "pb-editor-page-element",
        elementType: "droppableElement1",
        render: DroppableElement1,
        toolbar: {
            title: "Droppable Element 1",
            group: "pb-editor-element-group-media",
            preview() {
                return <>Droppable Element 1</>;
            }
        },
        settings: ["pb-editor-page-element-settings-delete"],
        target: ["contentGalleryDropzone"],
        onCreate: "open-settings",

        // `create` function creates the initial data for the page element.
        create(options) {
            return {
                type: "droppableElement1",
                elements: [],
                data: {},
                ...options
            };
        }
    } as PbEditorPageElementPlugin
];
