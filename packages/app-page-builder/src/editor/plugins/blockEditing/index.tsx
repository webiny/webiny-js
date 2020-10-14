import React from "react";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";
import { PbEditorBarPlugin, PbEditorContentPlugin } from "@webiny/app-page-builder/types";

export default [
    {
        name: "add-block",
        type: "pb-editor-content",
        render() {
            return <AddBlock />;
        }
    } as PbEditorContentPlugin,
    {
        name: "add-content",
        type: "pb-editor-content",
        render() {
            return <AddContent />;
        }
    } as PbEditorContentPlugin,
    {
        name: "pb-editor-search-blocks-bar",
        type: "pb-editor-bar",
        shouldRender({ plugins }) {
            const active = plugins.get("pb-editor-bar");
            if (!active || active.length === 0) {
                return false;
            }
            return active.find(pl => pl.name === "pb-editor-search-blocks-bar");
        },

        render() {
            return <SearchBlocks />;
        }
    } as PbEditorBarPlugin
];
