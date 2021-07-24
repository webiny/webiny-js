import * as React from "react";
import SearchBar from "./SearchBar";
import { AdminHeaderMiddlePlugin } from "../../types";

export const globalSearch: AdminHeaderMiddlePlugin = {
    name: "admin-global-search",
    type: "admin-header-middle",
    render() {
        return <SearchBar />;
    }
};

export const globalSearchHotkey = {
    type: "admin-global-search-prevent-hotkey",
    name: "admin-global-search-prevent-hotkey-input",
    preventOpen(e) {
        // Define a list of all node types we want to prevent the event from.
        const ignoreNodes = ["INPUT", "TEXTAREA"];

        if (ignoreNodes.includes(e.target.nodeName)) {
            return true;
        }
    }
};
