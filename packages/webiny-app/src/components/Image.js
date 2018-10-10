// @flow
import * as React from "react";
import invariant from "invariant";
import { getPlugins } from "webiny-app/plugins";
import type { Plugin } from "webiny-app/types";

export type ImageTransformation = Object;

export type ImagePlugin = Plugin & {
    render: ({ src: string }) => React.Node,
    getImageUrl: () => string
};

export type ImagePresetPlugin = Plugin & {
    type: "image-preset",
    transformations: Array<ImageTransformation>
};

type Props = Object & {
    src: string,
    plugin?: string,
    preset?: string,
    transformations: Array<ImageTransformation>
};

export default (props: Props) => {
    const plugin = getPlugins(props.plugin || "default-image-plugin");

    invariant(plugin, "Image component plugin not defined.");
    return plugin.render(props);
};
