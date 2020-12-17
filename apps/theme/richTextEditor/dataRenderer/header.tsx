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
                    return <h1 dangerouslySetInnerHTML={{ __html: block.data.text }} />;

                case 2:
                    return <h2 dangerouslySetInnerHTML={{ __html: block.data.text }} />;

                case 3:
                    return <h3 dangerouslySetInnerHTML={{ __html: block.data.text }} />;

                case 4:
                    return <h4 dangerouslySetInnerHTML={{ __html: block.data.text }} />;

                case 5:
                    return <h5 dangerouslySetInnerHTML={{ __html: block.data.text }} />;

                case 6:
                    return <h6 dangerouslySetInnerHTML={{ __html: block.data.text }} />;
            }
        }
    } as RTEDataBlockRendererPlugin);
