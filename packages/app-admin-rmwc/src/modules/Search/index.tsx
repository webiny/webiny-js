import React from "react";
import { Compose, SearchRenderer as SearchSpec } from "@webiny/app-admin";

// For the time being, import the existing component.
// TODO: implement a new SearchBar component
import SearchBar from "@webiny/app-admin/plugins/globalSearch/SearchBar";

const SearchRenderer = () => {
    return function Search() {
        return <SearchBar />;
    };
};

export const Search = () => {
    return <Compose component={SearchSpec} with={SearchRenderer} />;
};
