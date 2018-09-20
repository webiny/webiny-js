import React from "react";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";
import { getActivePlugin } from "webiny-app-cms/editor/selectors";

export default [
    {
        name: "add-block",
        type: "cms-editor-content",
        render() {
            return <AddBlock />;
        }
    },
    {
        name: "add-content",
        type: "cms-editor-content",
        render() {
            return <AddContent />;
        }
    },
    {
        name: "cms-search-blocks-bar",
        type: "cms-editor-bar",
        shouldRender({ state }) {
            return getActivePlugin("cms-editor-bar")(state) === "cms-search-blocks-bar";
        },

        render() {
            return <SearchBlocks />;
        }
    }
];
