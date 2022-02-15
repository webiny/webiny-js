import React from "react";

export const globalSearchHotkey = {
    type: "admin-global-search-prevent-hotkey",
    name: "admin-global-search-prevent-hotkey-input",
    preventOpen(e: React.ChangeEvent<HTMLInputElement>): boolean {
        // Define a list of all node types we want to prevent the event from.
        const ignoreNodes = ["INPUT", "TEXTAREA"];

        return ignoreNodes.includes(e.target.nodeName);
    }
};
