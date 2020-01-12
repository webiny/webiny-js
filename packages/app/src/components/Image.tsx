import * as React from "react";
import invariant from "invariant";
import { getPlugin } from "@webiny/plugins";
import { get } from "lodash";
import { ImageComponentPlugin, ImageProps } from "@webiny/app/types";

export const Image: React.FC<ImageProps> = ({ preset: presetName, ...props }) => {
    const plugin = getPlugin("image-component") as ImageComponentPlugin;
    if (!plugin) {
        throw new Error(`Image component plugin (type "image-component") not defined.`);
    }

    if (presetName) {
        const preset = get(plugin, `presets.${presetName}`);
        invariant(preset, `Transform preset "${presetName}" not found.`);
        props.transform = preset;
    }

    if (props.transform) {
        props.src = plugin.getImageSrc(props);
    }

    return plugin.render(props);
};
