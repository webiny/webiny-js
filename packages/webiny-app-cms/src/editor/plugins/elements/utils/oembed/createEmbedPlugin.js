// @flow
import * as React from "react";
import OEmbed from "webiny-app-cms/editor/components/OEmbed";
import type { ElementPluginType } from "webiny-app-cms/types";
import OEmbedUrl from "./OEmbedUrl";

type EmbedPluginConfig = {
    type: string,
    toolbar: {
        title: string,
        group: string,
        preview: () => React.Node
    },
    oembed?: {
        urlDescription: string,
        urlPlaceholder: string,
        global?: string,
        sdk?: string,
        renderInput?: () => React.Node,
        renderEmbed?: () => React.Node
    },
    settings?: Array<string>,
    target?: Array<string>
};

export const createEmbedPlugin = (config: EmbedPluginConfig): ElementPluginType => {
    return {
        name: "cms-element-" + config.type,
        type: "cms-element",
        toolbar: config.toolbar,
        settings: config.settings || [
            "cms-element-settings-delete",
            "",
            "cms-element-settings-advanced"
        ],
        target: config.target || ["cms-element-column", "cms-element-row", "cms-element-list-item"],
        create({ content = {}, ...options }) {
            return {
                type: "cms-element-" + config.type,
                elements: [],
                data: { url: "" },
                settings: {},
                ...options
            };
        },
        render({ element }: Object) {
            return <OEmbed element={element} {...config.oembed || {}} />;
        }
    };
};

type EmbedPluginSidebarConfig = {
    type: string,
    urlPlaceholder: string,
    urlDescription: string
};
export const createEmbedSidebarPlugin = ({
    type,
    urlDescription,
    urlPlaceholder
}: EmbedPluginSidebarConfig) => {
    return {
        name: "cms-element-sidebar-" + type,
        type: "cms-element-sidebar",
        element: "cms-element-" + type,
        render({ Bind }) {
            return (
                <OEmbedUrl
                    Bind={Bind}
                    urlPlaceholder={urlPlaceholder}
                    urlDescription={urlDescription}
                />
            );
        }
    };
};
