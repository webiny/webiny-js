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
            const active = get(plugins, "cms-editor-bar") || [];
            return active ? active.find(pl => pl.name === "cms-search-blocks-bar") : false;
        },

        render() {
            return <SearchBlocks />;
        }
    }
];
