import React, { useCallback, useEffect, useState } from "react";
import { makeComposable } from "@webiny/app";

export interface SearchOptionData {
    route: string;
    label: string;
    search?: {
        operator?: "and" | "or";
        fields?: Array<string>;
    };
}

export interface SearchContext {
    options: SearchOptionData[];
    addOption(option: SearchOptionData): void;
}

const SearchContext = React.createContext<SearchContext>({
    options: [],
    addOption: () => {
        return void 0;
    }
});
SearchContext.displayName = "SearchContext";

export function useSearch() {
    return React.useContext(SearchContext);
}

export interface SearchProviderProps {
    children: React.ReactNode;
}

export const SearchProvider = (
    Component: React.VFC<SearchProviderProps>
): React.VFC<SearchProviderProps> => {
    return function SearchProvider({ children, ...props }) {
        const [options, setOptions] = useState<SearchOptionData[]>([]);

        const addOption = useCallback<SearchContext["addOption"]>(
            option => setOptions(options => [...options, option]),
            [setOptions]
        );

        const context = {
            options,
            addOption
        };

        return (
            <SearchContext.Provider value={context}>
                <Component {...props}>{children}</Component>
            </SearchContext.Provider>
        );
    };
};

export const Search = makeComposable("Search", () => {
    return <SearchRenderer />;
});

export const SearchRenderer = makeComposable("SearchRenderer");

export type SearchOptionProps = SearchOptionData;

export const SearchOption: React.VFC<SearchOptionProps> = props => {
    const { addOption } = useSearch();

    useEffect(() => {
        addOption(props);
    }, []);

    return null;
};
