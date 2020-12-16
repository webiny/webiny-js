import React, { useMemo } from "react";
import { OutputBlockData } from "@editorjs/editorjs";
import { plugins } from "@webiny/plugins";
import { RTEDataBlockRendererPlugin, RTEDataRendererPlugin } from "../../types";

export enum BlockType {
    header = "header",
    paragraph = "paragraph",
    image = "image",
    quote = "quote",
    list = "list"
}

const renderPlugin = ({
    blockType,
    plugins,
    renderParams
}: {
    blockType: BlockType;
    plugins: Record<string, RTEDataBlockRendererPlugin>;
    renderParams: { block: OutputBlockData; options: {} };
}) => {
    const { block, options } = renderParams;
    // Get the plugin.
    const pl = plugins[blockType];
    // Render output using plugin.
    if (pl) {
        return React.cloneElement(pl.render(block), options);
    }
    // TODO: Display the error message in UI.
    // Warn about missing plugin.
    console.error(`Missing plugin: "rte-block-output-renderer-${blockType}".`);
};

const rteOutputRendererPlugin = (): RTEDataRendererPlugin => ({
    type: "rte-data-renderer",
    outputType: "jsx",
    render(data: OutputBlockData[]) {
        const blockPlugins = useMemo(() => {
            // Get all plugins
            const allPlugins = plugins.byType<RTEDataBlockRendererPlugin>(
                "rte-block-output-renderer"
            );
            // Group plugins by blockType
            return allPlugins.reduce((acc, pl) => {
                acc[pl.blockType] = pl;
                return acc;
            }, {});
        }, []);

        return data.map((block, index) => {
            const renderParams = { block, options: { key: index } };
            const blockType = block.type as BlockType;

            return renderPlugin({ blockType, plugins: blockPlugins, renderParams });
        });
    }
});

export default rteOutputRendererPlugin;
