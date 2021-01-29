import React from "react";
import { OutputBlockData } from "@editorjs/editorjs";
import { plugins } from "@webiny/plugins";
import { RTEDataBlockRendererPlugin, RTEDataRendererPlugin } from "../../types";

const renderPlugin = ({
    blockType,
    plugins,
    renderParams
}: {
    blockType: string;
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
    // Warn about a missing plugin.
    console.error(`Missing plugin: "rte-data-block-renderer-${blockType}".`);
};

const rteOutputRendererPlugin = (): RTEDataRendererPlugin => ({
    type: "rte-data-renderer",
    outputType: "react",
    render(data: OutputBlockData[]) {
        // Get all plugins
        const allPlugins = plugins
            .byType<RTEDataBlockRendererPlugin>("rte-data-block-renderer")
            .filter(({ outputType }) => outputType === "react");

        // Group plugins by blockType
        const blockPlugins = allPlugins.reduce((acc, pl) => {
            acc[pl.blockType] = pl;
            return acc;
        }, {});

        return data.map((block, index) => {
            const renderParams = { block, options: { key: index } };
            const blockType = block.type;

            return renderPlugin({ blockType, plugins: blockPlugins, renderParams });
        });
    }
});

export default rteOutputRendererPlugin;
