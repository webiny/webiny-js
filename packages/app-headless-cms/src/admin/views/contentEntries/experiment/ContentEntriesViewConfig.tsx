import React, { useContext, useState } from "react";
import { makeComposable, Compose, HigherOrderComponent } from "@webiny/app-admin";
import { Property, Properties, toObject } from "@webiny/react-properties";

interface ContentEntriesViewConfig extends React.FC<unknown> {
    Filter: React.FC<ContentEntriesViewConfigFilterProps>;
    Sorter: React.FC<ContentEntriesViewConfigSorterProps>;
}

const ContentEntriesViewConfigApply = makeComposable(
    "ContentEntriesViewConfigApply",
    ({ children }) => {
        return <>{children}</>;
    }
);

const createHOC =
    (newChildren: React.ReactNode): HigherOrderComponent =>
    BaseComponent => {
        return function ConfigHOC({ children }) {
            return (
                <BaseComponent>
                    {newChildren}
                    {children}
                </BaseComponent>
            );
        };
    };

/**
 * @deprecated Use ContentEntryListConfig instead
 */
export const ContentEntriesViewConfig: ContentEntriesViewConfig = ({ children }) => {
    return <Compose component={ContentEntriesViewConfigApply} with={createHOC(children)} />;
};

export interface ContentEntriesViewConfigFilterProps {
    name: string;
    element?: React.ReactElement<unknown>;
    modelIds?: string[];
    remove?: boolean;
    before?: string;
    after?: string;
}

const Filter: React.FC<ContentEntriesViewConfigFilterProps> = ({
    name,
    element,
    modelIds = [],
    after = undefined,
    before = undefined,
    remove = false
}) => {
    const placeBefore = before !== undefined ? `filter:${before}` : undefined;
    const placeAfter = after !== undefined ? `filter:${after}` : undefined;

    return (
        <Property
            id={`filter:${name}`}
            name={"filters"}
            remove={remove}
            array={true}
            before={placeBefore}
            after={placeAfter}
        >
            <Property id={`filter:${name}:name`} name={"name"} value={name} />
            <Property id={`filter:${name}:modelIds`} name={"modelIds"} value={modelIds} />
            {element ? (
                <Property id={`filter:${name}:element`} name={"element"} value={element} />
            ) : null}
        </Property>
    );
};

export interface ContentEntriesViewConfigSorterProps {
    name: string;
    label: string;
    modelIds?: string[];
    remove?: boolean;
}

const Sorter: React.FC<ContentEntriesViewConfigSorterProps> = ({
    name,
    label,
    modelIds = [],
    remove = false
}) => {
    return (
        <Property id={`sorter:${name}`} name={"sorters"} remove={remove} array={true}>
            <Property id={`sorter:${name}:name`} name={"name"} value={name} />
            <Property id={`sorter:${name}:label`} name={"label"} value={label} />
            <Property id={`sorter:${name}:modelIds`} name={"modelIds"} value={modelIds} />
        </Property>
    );
};

ContentEntriesViewConfig.Filter = Filter;
ContentEntriesViewConfig.Sorter = Sorter;

interface ViewContext {
    properties: Property[];
}

const defaultContext = { properties: [] };

const ViewContext = React.createContext<ViewContext>(defaultContext);

export const ContentEntriesView = makeComposable("ContentEntriesView", () => {
    const [properties, setProperties] = useState<Property[]>([]);
    const context = { properties };

    const stateUpdater = (properties: Property[]) => {
        setProperties(properties);
    };

    return (
        <ViewContext.Provider value={context}>
            <Properties onChange={stateUpdater}>
                <ContentEntriesViewConfigApply />
                <ContentEntriesViewRenderer />
            </Properties>
        </ViewContext.Provider>
    );
});

export const ContentEntriesViewRenderer = makeComposable("ContentEntriesViewRenderer");

export interface ContentEntriesViewConfigFilter {
    name: string;
    element: React.ReactElement;
    modelIds: string[];
}

export interface ContentEntriesViewConfigSorter {
    name: string;
    label: string;
    modelIds: string[];
}

interface ContentEntriesViewConfigData {
    filters: ContentEntriesViewConfigFilter[];
    sorters: ContentEntriesViewConfigSorter[];
}

export function useContentEntriesViewConfig() {
    const { properties } = useContext(ViewContext);

    const config = toObject<ContentEntriesViewConfigData>(properties);

    return {
        filters: config.filters || [],
        sorters: config.sorters || []
    };
}
