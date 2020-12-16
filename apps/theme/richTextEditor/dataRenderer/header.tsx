import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";
import { BlockType } from "./index";

export default () =>
    ({
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-header",
        blockType: BlockType.header,
        render(block) {
            switch (block.data.level) {
                case 1:
                    return <h1>{block.data.text}</h1>;

                case 2:
                    return <h2>{block.data.text}</h2>;

                case 3:
                    return <h3>{block.data.text}</h3>;

                case 4:
                    return <h4>{block.data.text}</h4>;

                case 5:
                    return <h5>{block.data.text}</h5>;

                case 6:
                    return <h6>{block.data.text}</h6>;
            }
        }
    } as RTEDataBlockRendererPlugin);
