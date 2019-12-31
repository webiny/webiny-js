import * as React from "react";
import invariant from "invariant";
import { getPlugin } from "@webiny/plugins";
import { PluginType } from "@webiny/plugins/types";
import { get } from "lodash";

interface ImageProps {
    src: string;
    preset?: string;
    transform?: Object;
    // "auto" is a special keyword - if present, plugins insert their own srcSet.
    srcSet?: Object | "auto";
}

/**
 * "getImageSrc" has to be defined as a separate property, so its functionality can be reused outside of
 * the Image component. This is ideal in cases where manual creation of image src is needed.
 */
export interface ImageComponentPluginType extends PluginType {
    type: string;
    render: (props: ImageProps) => React.ReactNode;
    getImageSrc: (props?: Object) => string;
    presets: { [key: string]: any };
}

const Component = (props: ImageProps) => {
    const { preset: presetName, ...rest } = props;

    const instance = getPlugin("image-component") as ImageComponentPluginType;
    if (!instance) {
        throw new Error(`Image component plugin (type "image-component") not defined.`);
    }

    const plugin = { instance, props: { ...rest } };

    if (presetName) {
        const preset = get(plugin.instance, `presets.${presetName}`);
        invariant(preset, `Transform preset "${presetName}" not found.`);
        plugin.props.transform = preset;
    }

    if (plugin.props.transform) {
        plugin.props.src = plugin.instance.getImageSrc(plugin.props);
    }

    return plugin.instance.render(plugin.props);
};

export const Image = Component;
