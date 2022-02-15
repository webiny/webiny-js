import React from "react";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";
import { PbEditorBarPlugin, PbEditorContentPlugin } from "~/types";

const addBlockPlugin: PbEditorContentPlugin = {
    name: "add-block",
    type: "pb-editor-content",
    render() {
        return <AddBlock />;
    }
};
const addContentPlugin: PbEditorContentPlugin = {
    name: "add-content",
    type: "pb-editor-content",
    render() {
        return <AddContent />;
    }
};
const editorBarPlugin: PbEditorBarPlugin = {
    name: "pb-editor-search-blocks-bar",
    type: "pb-editor-bar",
    shouldRender({ plugins }): boolean {
        const active = plugins["pb-editor-bar"];
        if (!active || active.length === 0) {
            return false;
        }
        return active.some(pl => pl.name === "pb-editor-search-blocks-bar");
    },
    render(): React.ReactElement {
        return <SearchBlocks />;
    }
};
export default [addBlockPlugin, addContentPlugin, editorBarPlugin];
