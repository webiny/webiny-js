import invariant from "invariant";
import { plugins } from "@webiny/plugins";
import { immutableGet } from "@webiny/stdlib";
import type { GenericRecord, ImageComponentPlugin, ImageProps } from "~/types.js";

export const Image = ({ preset: presetName, ...props }: ImageProps) => {
    const plugin = plugins.byName<ImageComponentPlugin>("image-component");
    if (!plugin) {
        throw new Error(`Image component plugin (type "image-component") not defined.`);
    }

    if (presetName) {
        const preset = immutableGet<GenericRecord>(plugin, `presets.${presetName}`);
        invariant(preset, `Transform preset "${presetName}" not found.`);
        props.transform = preset;
    }

    if (props.transform) {
        props.src = plugin.getImageSrc(props);
    }

    return plugin.render(props);
};
