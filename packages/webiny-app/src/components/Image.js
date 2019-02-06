// @flow
import * as React from "react";
import invariant from "invariant";
import { getPlugin } from "webiny-plugins";
import type { PluginType } from "webiny-plugins/types";
import { get } from "lodash";

type ImageProps = Object & {
    src: string,
    preset?: string,
    transform?: Object
};

export type ImagePlugin = PluginType & {
    type: string,
    render: ImageProps => React.Node
};

const Component = (props: ImageProps) => {
    let { preset: presetName, ...rest } = props;

    const plugin = { instance: getPlugin("image-component"), props: { ...rest } };
    invariant(plugin.instance, `Image component plugin (type "image-component") not defined.`);

    if (presetName) {
        const preset = get(plugin.instance, `presets.${presetName}`);
        invariant(preset, `Transform preset "${presetName}" not found.`);
        plugin.props.transform = preset;
    }

    return plugin.instance.render(plugin.props);
};

export const Image = Component;
