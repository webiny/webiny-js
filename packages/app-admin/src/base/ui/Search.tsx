import React, { useCallback, useEffect, useState } from "react";
import { createProvider, createVoidComponent, makeDecoratable } from "@webiny/app";

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

interface SearchProviderProps {
    children: React.ReactNode;
    [key: string]: any;
}

export const SearchProvider = createProvider(Component => {
    return function SearchProvider({ children, ...props }: SearchProviderProps) {
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
});

export const Search = makeDecoratable("Search", () => {
    return <SearchRenderer />;
});

export const SearchRenderer = makeDecoratable("SearchRenderer", createVoidComponent());

export type SearchOptionProps = SearchOptionData;

export const SearchOption = (props: SearchOptionProps) => {
    const { addOption } = useSearch();

    useEffect(() => {
        addOption(props);
    }, []);

    return null;
};
