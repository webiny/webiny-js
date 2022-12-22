import React from "react";
import { BoldAction } from "~/components/Toolbar/ToolbarActions/BoldAction";
import { AddToolbarAction } from "~/components/Toolbar/Composable/AddToolbarAction/AddToolbarAction";
import { ItalicAction } from "~/components/Toolbar/ToolbarActions/ItalicAction";
export const HeadingToolbarPreset = () => {
    return (
        <>
            <AddToolbarAction element={<BoldAction />} type={"heading"} />
            <AddToolbarAction element={<ItalicAction />} type={"heading"} />
        </>
    );
};
