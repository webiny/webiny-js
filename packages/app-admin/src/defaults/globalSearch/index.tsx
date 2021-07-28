import * as React from "react";
import SearchBar from "./SearchBar";
import { AdminViewPlugin } from "~/plugins/AdminViewPlugin";
import { GenericElement } from "@webiny/ui-elements/GenericElement";

export const globalSearch = new AdminViewPlugin(view => {
    view.getHeaderElement()
        .getCenterSection()
        .addElement(new GenericElement("searchBar", () => <SearchBar />));
});

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
