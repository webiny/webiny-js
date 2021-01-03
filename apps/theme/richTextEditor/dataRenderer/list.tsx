import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";

export default (): RTEDataBlockRendererPlugin => {
    return {
        type: "rte-data-block-renderer",
        name: "rte-data-block-renderer-list",
        outputType: "react",
        blockType: "list",
        render(block) {
            switch (block.data.style) {
                case "unordered":
                    return (
                        <ul className={"rte-block-list"}>
                            {block.data.items.map((text, i) => (
                                <li key={i}>{text}</li>
                            ))}
                        </ul>
                    );

                case "ordered":
                    return (
                        <ol className={"rte-block-list"}>
                            {block.data.items.map((text, i) => (
                                <li key={i}>{text}</li>
                            ))}
                        </ol>
                    );
                default:
                    return null;
            }
        }
    };
};
