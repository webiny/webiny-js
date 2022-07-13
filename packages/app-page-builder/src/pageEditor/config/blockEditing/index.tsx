import React from "react";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";
import { Compose, HigherOrderComponent } from "@webiny/app-admin/";
import { EditorBar, EditorContent } from "~/editor";
import { useRecoilValue } from "recoil";
import { blocksBrowserStateAtom } from "~/pageEditor/config/blockEditing/state";

export const BlockBrowser: HigherOrderComponent = EditorBar => {
    return function PageSettingsOverlay() {
        const isActive = useRecoilValue(blocksBrowserStateAtom);

        return (
            <>
                <EditorBar />
                {isActive ? <SearchBlocks /> : null}
            </>
        );
    };
};

const EditorContentHoc: HigherOrderComponent = PrevContent => {
    return function EditorContent() {
        return (
            <>
                <PrevContent />
                <AddBlock />
                <AddContent />
            </>
        );
    };
};

export const BlockEditingPlugin = () => {
    return (
        <>
            <Compose component={EditorBar} with={BlockBrowser} />
            <Compose component={EditorContent} with={EditorContentHoc} />
        </>
    );
};
