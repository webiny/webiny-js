import React from "react";
import { createDecorator } from "@webiny/app-admin";
import { useRecoilValue } from "recoil";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";
import { EditorBar, EditorContent as BaseEditorContent } from "~/editor";
import { blocksBrowserStateAtom } from "~/pageEditor/config/blockEditing/state";
import { useTemplateMode } from "~/pageEditor/hooks/useTemplateMode";

const BlockBrowser = createDecorator(EditorBar, EditorBar => {
    return function PageSettingsOverlay() {
        const isActive = useRecoilValue(blocksBrowserStateAtom);

        return (
            <>
                <EditorBar />
                {isActive ? <SearchBlocks /> : null}
            </>
        );
    };
});

const EditorContent = createDecorator(BaseEditorContent, PrevContent => {
    return function EditorContent() {
        const [isTemplateMode] = useTemplateMode();

        return (
            <>
                <PrevContent />
                {!isTemplateMode && (
                    <>
                        <AddBlock />
                        <AddContent />
                    </>
                )}
            </>
        );
    };
});

export const BlockEditingPlugin = () => {
    return (
        <>
            <BlockBrowser />
            <EditorContent />
        </>
    );
};
