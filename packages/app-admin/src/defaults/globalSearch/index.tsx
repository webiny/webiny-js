import * as React from "react";
import SearchBar from "./SearchBar";
import { GenericElement } from "@webiny/ui-composer/elements/GenericElement";
import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { AdminView } from "~/views/AdminView";

// !EXAMPLE!
// This demonstrates how you can create view-specific plugin classes.
//
// class AdminViewPlugin extends ViewPlugin<AdminView> {
//     constructor(apply: ApplyFunction<AdminView>) {
//         super(AdminView, apply);
//     }
// }

export const globalSearch = new UIViewPlugin<AdminView>(AdminView, view => {
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
