import React from "react";
import { get } from "lodash";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";

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
        shouldRender({ plugins }) {
            return get(plugins, "cms-editor-bar.active") === "cms-search-blocks-bar";
        },

        render() {
            return <SearchBlocks />;
        }
    }
];
