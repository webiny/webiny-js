import React from "react";
import { createElement } from "@webiny/app-page-builder/editor/helpers";
import { PbEditorBlockPlugin, PbEditorElement } from "@webiny/app-page-builder/types";

const width = 1000;
const height = 117;
const aspectRatio = width / height;

const plugin: PbEditorBlockPlugin = {
    name: "pb-editor-block-content-gallery",
    type: "pb-editor-block",
    blockCategory: "general",
    title: "Content Gallery Block",
    create(): PbEditorElement {
        return createElement("block", {
            elements: [createElement("contentGallery")],
            data: {
                ourCustomX: 123,
                settings: {
                    property: {
                        className: "content-gallery-block"
                    }
                }
            }
        });
    },
    image: {
        meta: {
            width,
            height,
            aspectRatio
        }
    },
    tags: [],
    preview(): React.ReactElement {
        return <>Content Gallery Block</>;
    }
};
export default plugin;
