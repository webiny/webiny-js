// @flow
import React from "react";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "./../../utils/oembed/createEmbedPlugin";
import type { ElementPluginType } from "webiny-app-cms/types";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "vimeo",
        toolbar: {
            title: "Vimeo",
            group: "cms-element-group-media",
            preview() {
                return <span>A vimeo sample</span>;
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "vimeo",
        urlDescription: "Vimeo video URL",
        urlPlaceholder: "Enter a video URL"
    })
];
