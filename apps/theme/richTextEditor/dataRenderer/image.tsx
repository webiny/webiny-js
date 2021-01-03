import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";

export default (): RTEDataBlockRendererPlugin => {
    return {
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-image",
        outputType: "react",
        blockType: "image",
        render(block) {
            return (
                <img className={"rte-block-image"} alt={block.data.caption} src={block.data.file} />
            );
        }
    };
};
