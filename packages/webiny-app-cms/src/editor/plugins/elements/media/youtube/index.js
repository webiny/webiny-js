// @flow
import React from "react";
import {
    createEmbedPlugin,
    createEmbedSidebarPlugin
} from "./../../utils/oembed/createEmbedPlugin";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "youtube",
        toolbar: {
            title: "Youtube",
            group: "cms-element-group-media",
            preview() {
                return <span>A youtube sample</span>;
            }
        },
        oembed: {
            urlDescription: "YouTube video URL",
            urlPlaceholder: "Enter a video URL"
        }
    }),
    createEmbedSidebarPlugin({
        type: "youtube",
        urlDescription: "YouTube video URL",
        urlPlaceholder: "Enter a video URL"
    })
];
