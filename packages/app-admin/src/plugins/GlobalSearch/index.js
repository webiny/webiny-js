//@flow
import React from "react";
import SearchBar from "./SearchBar";
import type { HeaderMiddlePlugin } from "@webiny/app-admin/types";

export const globalSearch: HeaderMiddlePlugin = {
    name: "global-search",
    type: "header-middle",
    render() {
        return <SearchBar />;
    }
};

export const globalSearchHotkey = {
    type: "global-search-prevent-hotkey",
    name: "global-search-prevent-hotkey-input",
    preventOpen(e) {
        if (e.target.nodeName === "INPUT") {
            return true;
        }
    }
};
