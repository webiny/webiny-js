import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";
import { BlockType } from "./index";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-list",
        blockType: BlockType.list,
        render(block) {
            switch (block.data.style) {
                case "unordered":
                    return (
                        <ul>
                            {block.data.items.map((text, i) => (
                                <li key={i}>{text}</li>
                            ))}
                        </ul>
                    );

                case "ordered":
                    return (
                        <ol>
                            {block.data.items.map((text, i) => (
                                <li key={i}>{text}</li>
                            ))}
                        </ol>
                    );
            }
        }
    } as RTEDataBlockRendererPlugin);
