import React from "react";
import { SearchBlocks } from "./SearchBlocks";
import { useBlocksBrowser } from "./useBlocksBrowser";

export const BlocksBrowser = () => {
    const { isOpen, closeBrowser } = useBlocksBrowser();

    return isOpen ? <SearchBlocks onClose={closeBrowser} /> : null;
};
