import * as React from "react";
import SearchBar from "./SearchBar";
import { AdminHeaderMiddlePlugin } from "@webiny/app-admin/types";

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
        if (e.target.nodeName === "INPUT") {
            return true;
        }
    }
};
