import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";

const defaultStyle = { maxWidth: "100%" };

export default (): RTEDataBlockRendererPlugin => {
    return {
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-image",
        outputType: "react",
        blockType: "image",
        render(block) {
            return <img style={defaultStyle} alt={block.data.caption} src={block.data.file} />;
        }
    };
};
