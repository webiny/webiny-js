import React from "react";
import { BoldAction } from "~/components/ToolbarActions/BoldAction";
import { AddToolbarAction } from "~/components/ToolbarComposable/AddToolbarAction";
import { ItalicAction } from "~/components/ToolbarActions/ItalicAction";
import { UnderlineAction } from "~/components/ToolbarActions/UnderlineAction";
import { CodeHighlightAction } from "~/components/ToolbarActions/CodeHighlightAction";
import { LinkAction } from "~/components/ToolbarActions/LinkAction";
import {FontSizeAction} from "~/components/ToolbarActions/FontSizeAction";
import { Divider } from "../../ui/Divider";

export const HeadingToolbarPreset = () => {
    return (
        <>
            <AddToolbarAction element={<FontSizeAction />} type={"heading"} />
            <AddToolbarAction element={<Divider />} type={"heading"} />
            <AddToolbarAction element={<BoldAction />} type={"heading"} />
            <AddToolbarAction element={<ItalicAction />} type={"heading"} />
            <AddToolbarAction element={<UnderlineAction />} type={"heading"} />
            <AddToolbarAction element={<CodeHighlightAction />} type={"heading"} />
            <AddToolbarAction element={<Divider />} type={"heading"} />
            <AddToolbarAction element={<LinkAction />} type={"heading"} />
        </>
    );
};
