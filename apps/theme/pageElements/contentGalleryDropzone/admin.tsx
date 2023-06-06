import React from "react";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { onReceived } from "@webiny/app-page-builder/editor/helpers";
import { ContentGalleryDropzone } from "./ContentGalleryDropzone";

export default [
    {
        name: "pb-editor-page-element-content-gallery-dropzone",
        type: "pb-editor-page-element",
        elementType: "contentGalleryDropzone",
        render: ContentGalleryDropzone,
        // toolbar: {
        //     title: "Content Gallery Dropzone",
        //     group: "pb-editor-element-group-media",
        //     preview() {
        //         return <>Content Gallery</>;
        //     }
        // },
        target: ["contentGallery"],
        onReceived,
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
