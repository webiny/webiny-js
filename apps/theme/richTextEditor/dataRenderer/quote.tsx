import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";
import { BlockType } from "./index";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-block",
        blockType: BlockType.quote,
        render(block) {
            return (
                <blockquote>
                    <p>{block.data.text}</p>
                </blockquote>
            );
        }
    } as RTEDataBlockRendererPlugin);
