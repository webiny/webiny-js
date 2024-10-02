import React from "react";
import { useRecoilValue } from "recoil";
import { BlockProvider } from "@webiny/app-page-builder-elements/renderers/block/BlockProvider";
import { Element } from "@webiny/app-page-builder-elements/types";
import { blockByElementSelector } from "~/editor/hooks/useCurrentBlockElement";
import { useActiveElementId } from "~/editor/hooks/useActiveElementId";

export const CurrentBlockProvider = ({ children }: { children: React.ReactNode }) => {
    const [activeElementId] = useActiveElementId();
    const editorBlock = useRecoilValue(blockByElementSelector(activeElementId || undefined));

    const block = editorBlock ? (editorBlock as Element) : null;

    return <BlockProvider block={block}>{children}</BlockProvider>;
};
