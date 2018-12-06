// @flow
import * as React from "react";
import invariant from "invariant";
import { getPlugin } from "webiny-plugins";
import type { PluginType } from "webiny-plugins/types";
import _ from "lodash";
import { withAppConfig } from "webiny-app/components/withAppConfig";

type ImageProps = Object & {
    src: string,
    plugin?: string,
    preset?: string,
    transform?: Object
};

export type ImagePlugin = PluginType & {
    type: string,
    render: ImageProps => React.Node
};

const Component = (props: ImageProps) => {
    let { config, plugin: pluginName, preset: presetName, transform, ...rest } = props;

    config = _.get(config, "components.Image");
    invariant(config, "Image component's configuration not found.");

    const plugin = {
        instance: getPlugin(pluginName || config.plugin),
        props: { ...rest, transform }
    };

    invariant(plugin.instance, "Image component plugin not defined.");

    if (presetName) {
        const preset = _.get(config, `presets.${presetName}`);
        invariant(preset, `Preset "${props.preset}" not found.`);
        plugin.props.transform = preset;
    }

    return plugin.instance.render(plugin.props);
};

export const Image = withAppConfig()(Component);
