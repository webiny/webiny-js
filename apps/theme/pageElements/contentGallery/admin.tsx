import React from "react";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { createElement } from "@webiny/app-page-builder/editor/helpers";

import { ContentGallery } from "./ContentGallery";

export default [
    {
        name: "pb-editor-page-element-content-gallery",
        type: "pb-editor-page-element",
        elementType: "contentGallery",
        render: ContentGallery,
        toolbar: {
            title: "Content Gallery",
            group: "pb-editor-element-group-media",
            preview() {
                return <>Content Gallery</>;
            }
        },
        settings: ["pb-editor-page-element-settings-delete"],
        target: ["cell", "block"],
        onCreate: "open-settings",
        create(options) {
            return {
                type: "contentGallery",
                elements: [
                    createElement("heading"),
                    createElement("paragraph"),
                    createElement("paragraph"),
                    createElement("contentGalleryDropzone")
                ],
                data: {},
                ...options
            };
        }
    } as PbEditorPageElementPlugin
];
