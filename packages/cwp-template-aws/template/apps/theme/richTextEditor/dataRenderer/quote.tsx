import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";

export default (): RTEDataBlockRendererPlugin => {
    return {
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-block",
        outputType: "react",
        blockType: "quote",
        render(block) {
            return (
                <blockquote className={"rte-block-blockquote"}>
                    <p>{block.data.text}</p>
                </blockquote>
            );
        }
    };
};
