import React from "react";
import { LOCAL_STORAGE_KEY_LATEST_VISITED_FOLDER, PAGE_LIST_ROUTE } from "~/constants";
import { NavigateFolderWithRouterProvider } from "@webiny/app-aco/contexts/navigateFolderWithRouter.js";

const createStorageKey = () => {
    return LOCAL_STORAGE_KEY_LATEST_VISITED_FOLDER;
};

const createListLink = () => {
    return PAGE_LIST_ROUTE;
};

export const NavigateFolderProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <NavigateFolderWithRouterProvider
            createStorageKey={createStorageKey}
            createListLink={createListLink}
        >
            {children}
        </NavigateFolderWithRouterProvider>
    );
};
