import React from "react";
import { BoldAction } from "~/components/Toolbar/ToolbarActions/BoldAction";
import { AddToolbarAction } from "~/components/Toolbar/Composable/AddToolbarAction/AddToolbarAction";
import { ItalicAction } from "~/components/Toolbar/ToolbarActions/ItalicAction";
import { UnderlineAction } from "~/components/Toolbar/ToolbarActions/UnderlineAction";
export const HeadingToolbarPreset = () => {
    return (
        <>
            <AddToolbarAction element={<BoldAction />} type={"heading"} />
            <AddToolbarAction element={<ItalicAction />} type={"heading"} />
            <AddToolbarAction element={<UnderlineAction />} type={"heading"} />
        </>
    );
};
