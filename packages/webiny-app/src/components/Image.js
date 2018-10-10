// @flow
import * as React from "react";
import invariant from "invariant";
import { getPlugin } from "webiny-app/plugins";
import type { Plugin } from "webiny-app/types";

type ImageProps = Object & {
    src: string,
    plugin?: string,
    preset?: string,
    transform?: Object
};

export type ImagePlugin = Plugin & {
    type: "image-component-plugin",
    render: ImageProps => React.Node
};

export type ImagePresetPlugin = Plugin & {
    type: "image-component-preset",
    transform: Object
};

export const Image = (props: ImageProps) => {
    const plugin: ?ImageProps = getPlugin(props.plugin || "image-component-plugin-default");

    invariant(plugin, "Image component plugin not defined.");

    let transform = props.transform;
    if (props.preset) {
        const preset: ?ImagePresetPlugin = getPlugin(props.preset);
        invariant(preset, `Preset "${props.preset}" not found.`);
        transform = preset.transform;
    }
    return plugin.render({ ...props, ...{ transform } });
};
