// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "./../../utils/oembed/createEmbedPlugin";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "instagram",
        toolbar: {
            title: "Instagram",
            group: "cms-element-group-social",
            preview() {
                return <span>An instagram sample</span>;
            }
        },
        oembed: {
            global: "instgrm",
            sdk: "https://platform.instagram.com/en_US/embeds.js",
            init({ node }) {
                window.instgrm.Embeds.process(node);
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "instagram",
        urlDescription: "Instagram post URL",
        urlPlaceholder: "Enter an Instagram post URL"
    })
];
