// @flow
import * as React from "react";
import OEmbed from "@webiny/app-page-builder/editor/components/OEmbed";
import type { PbElementPlugin } from "@webiny/app-page-builder/admin/types";

type EmbedPluginConfig = {
    type: string,
    toolbar?: {
        title?: string,
        group?: string,
        preview?: () => React.ReactNode
    },
    render?: ({ element: Object }) => React.ReactNode,
    oembed?: {
        global?: string,
        sdk?: string,
        onData?: Function,
        renderEmbed?: () => React.ReactNode
    },
    settings?: Array<string>,
    target?: Array<string>,
    onCreate?: string,
    renderElementPreview?: Function
};

export const createEmbedPlugin = (config: EmbedPluginConfig): PbElementPlugin => {
    return {
        name: "pb-page-element-" + config.type,
        type: "pb-page-element",
        elementType: config.type,
        toolbar: config.toolbar,
        settings: config.settings || ["pb-page-element-settings-delete", ""],
        target: config.target || ["column", "row", "list-item"],
        // eslint-disable-next-line
        create({ content = {}, ...options }: Object) {
            return {
                type: config.type,
                elements: [],
                data: {
                    settings: {
                        margin: { desktop: { all: 0 }, mobile: { all: 0 } },
                        padding: { desktop: { all: 0 }, mobile: { all: 0 } }
                    }
                },
                ...options
            };
        },
        render(props: Object) {
            if (config.render) {
                return config.render(props);
            }

            return <OEmbed element={props.element} {...(config.oembed || {})} />;
        },
        onCreate: config.onCreate || "open-settings",
        renderElementPreview: config.renderElementPreview
    };
};

type EmbedPluginSidebarConfig = {
    type: string,
    render?: ({ Bind: React.ComponentType<*> }) => React.ReactNode
};
export const createEmbedSettingsPlugin = ({ type, render }: EmbedPluginSidebarConfig) => {
    return {
        name: "pb-page-element-advanced-settings-" + type,
        type: "pb-page-element-advanced-settings",
        elementType: type,
        render
    };
};
