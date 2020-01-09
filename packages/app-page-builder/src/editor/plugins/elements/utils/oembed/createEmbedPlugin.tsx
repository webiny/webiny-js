import * as React from "react";
import { BindComponent } from "@webiny/form";
import OEmbed, { OEmbedProps } from "@webiny/app-page-builder/editor/components/OEmbed";
import {
    PbElement,
    PbElementPlugin,
    PbPageElementAdvancedSettingsPlugin
} from "@webiny/app-page-builder/admin/types";

type EmbedPluginConfig = {
    type: string;
    toolbar?: {
        title?: string;
        group?: string;
        preview?: () => React.ReactNode;
    };
    render?: ({ element }) => React.ReactNode;
    oembed?: {
        global?: string;
        sdk?: string;
        onData?: Function;
        renderEmbed?: (props: OEmbedProps) => React.ReactElement;
        init?: (params: { node: HTMLElement }) => void;
    };
    settings?: Array<string>;
    target?: Array<string>;
    onCreate?: string;
    renderElementPreview?: (params: {
        element: PbElement;
        width: number;
        height: number;
    }) => React.ReactElement;
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
        create({ content = {}, ...options }) {
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
        render(props) {
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
    type: string;
    render(params?: { Bind: BindComponent }): React.ReactElement;
};

export const createEmbedSettingsPlugin = ({
    type,
    render
}: EmbedPluginSidebarConfig): PbPageElementAdvancedSettingsPlugin => {
    return {
        name: "pb-page-element-advanced-settings-" + type,
        type: "pb-page-element-advanced-settings",
        elementType: type,
        render
    };
};
