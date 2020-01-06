// @flow
import React from "react";
import { get } from "lodash";
import AddBlock from "./AddBlock";
import AddContent from "./AddContent";
import SearchBlocks from "./SearchBlocks";

export default [
    {
        name: "add-block",
        type: "pb-editor-content",
        render() {
            return <AddBlock />;
        }
    },
    {
        name: "add-content",
        type: "pb-editor-content",
        render() {
            return <AddContent />;
        }
    },
    {
        name: "pb-editor-search-blocks-bar",
        type: "pb-editor-bar",
        shouldRender({ plugins }: Object) {
            const active = get(plugins, "pb-editor-bar") || [];
            return active ? active.find(pl => pl.name === "pb-editor-search-blocks-bar") : false;
        },

        render() {
            return <SearchBlocks />;
        }
    }
];
