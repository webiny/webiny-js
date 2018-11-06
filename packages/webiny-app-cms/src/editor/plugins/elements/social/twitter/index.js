// @flow
import React from "react";
import type { ElementPluginType } from "webiny-app-cms/types";
import { createEmbedPlugin, createEmbedSettingsPlugin } from "./../../utils/oembed/createEmbedPlugin";

export default (): Array<ElementPluginType> => [
    createEmbedPlugin({
        type: "twitter",
        toolbar: {
            title: "Twitter",
            group: "cms-element-group-social",
            preview() {
                return <span>A tweet sample</span>;
            }
        },
        oembed: {
            global: "twttr",
            sdk: "https://platform.twitter.com/widgets.js",
            init({ node }) {
                window.twttr.widgets.load(node);
            }
        }
    }),
    createEmbedSettingsPlugin({
        type: "twitter",
        urlDescription: "Tweet URL",
        urlPlaceholder: "Enter a Tweet URL"
    })
];
