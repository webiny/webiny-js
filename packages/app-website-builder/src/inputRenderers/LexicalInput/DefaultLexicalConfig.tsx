import React from "react";
import { CompositionScope } from "@webiny/react-composition";
import { StaticToolbarContainer } from "./LexicalEditorConfig.js";
import { CompactToolbar, ExpandedToolbar } from "./toolbars.js";

export const DefaultLexicalConfig = () => {
    return (
        <>
            <CompositionScope name={"compact"}>
                <StaticToolbarContainer>
                    <CompactToolbar />
                </StaticToolbarContainer>
            </CompositionScope>
            <CompositionScope name={"expanded"}>
                <StaticToolbarContainer>
                    <ExpandedToolbar />
                </StaticToolbarContainer>
            </CompositionScope>
        </>
    );
};
