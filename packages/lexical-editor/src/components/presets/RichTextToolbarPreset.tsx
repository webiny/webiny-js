import React from "react";
import { BoldAction } from "~/components/Toolbar/ToolbarActions/BoldAction";
import { AddToolbarAction } from "~/components/Toolbar/Composable/AddToolbarAction/AddToolbarAction";
import { ItalicAction } from "~/components/Toolbar/ToolbarActions/ItalicAction";
import { UnderlineAction } from "~/components/Toolbar/ToolbarActions/UnderlineAction";
import { CodeHighlightAction } from "~/components/Toolbar/ToolbarActions/CodeHighlightAction";
import { LinkAction } from "~/components/Toolbar/ToolbarActions/LinkAction";
import {FontSizeAction} from "~/components/Toolbar/ToolbarActions/FontSizeAction";
export const HeadingToolbarPreset = () => {
    return (
        <>
            <AddToolbarAction element={<BoldAction />} type={"heading"} />
            <AddToolbarAction element={<ItalicAction />} type={"heading"} />
            <AddToolbarAction element={<UnderlineAction />} type={"heading"} />
            <AddToolbarAction element={<FontSizeAction />} type={"heading"} />
            <AddToolbarAction element={<CodeHighlightAction />} type={"heading"} />
            <AddToolbarAction element={<LinkAction />} type={"heading"} />
        </>
    );
};
