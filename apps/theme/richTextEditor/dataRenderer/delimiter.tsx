import React from "react";
import { RTEDataBlockRendererPlugin } from "../../types";

export default (): RTEDataBlockRendererPlugin => {
    return {
        type: "rte-data-block-renderer",
        outputType: "react",
        blockType: "delimiter",
        render() {
            return <div className="rte-block-delimiter" />;
        }
    };
};
