import React from "react";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { ContentGalleryDropzone } from "./ContentGalleryDropzone";

export default [
    {
        name: "pb-editor-page-element-content-gallery-dropzone",
        type: "pb-editor-page-element",
        elementType: "contentGalleryDropzone",
        render: ContentGalleryDropzone,
        target: ["contentGallery"],
        canReceiveChildren: true,
        onCreate: "open-settings",
        create(options) {
            return {
                type: "contentGalleryDropzone",
                elements: [],
                data: {},
                ...options
            };
        }
    } as PbEditorPageElementPlugin
];
