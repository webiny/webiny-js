import React, { useCallback, useEffect, useState } from "react";
import { makeComposable } from "~/admin/makeComposable";

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

const SearchContext = React.createContext<SearchContext>(null);
SearchContext.displayName = "SearchContext";

export function useSearch() {
    return React.useContext(SearchContext);
}

export const SearchProvider = Component => {
    return function SearchProvider({ children, ...props }) {
        const [options, setOptions] = useState([]);

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

export const SearchRenderer = makeComposable("SearchRenderer", () => {
    useEffect(() => {
        console.info(
            `<SearchRenderer/> is not implemented! To provide an implementation, use the <Compose/> component.`
        );
    }, []);

    return null;
});

export type SearchOptionProps = SearchOptionData;

export const SearchOption = (props: SearchOptionProps) => {
    const { addOption } = useSearch();

    useEffect(() => {
        addOption(props);
    }, []);

    return null;
};
