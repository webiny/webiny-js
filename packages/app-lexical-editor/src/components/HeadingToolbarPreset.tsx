import React from "react";
import { BoldAction } from "~/components/Toolbar/ToolbarActions/BoldAction";
import { AddToolbarAction } from "~/components/Toolbar/Composable/AddToolbarAction/AddToolbarAction";

export const HeadingToolbarPreset = () => {
    return (
        <>
            <AddToolbarAction element={<BoldAction />} type={"heading"} />
        </>
    );
};
