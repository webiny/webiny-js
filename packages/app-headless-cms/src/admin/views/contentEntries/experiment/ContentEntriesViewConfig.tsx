import { makeComposable, Compose, HigherOrderComponent } from "@webiny/app-admin";
import React, { useContext, useState } from "react";
import { Property, PropertyContainer, toObject } from "./Property";

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

export const ContentEntriesViewConfig: ContentEntriesViewConfig = ({ children }) => {
    return <Compose component={ContentEntriesViewConfigApply} with={createHOC(children)} />;
};

export interface ContentEntriesViewConfigFilterProps {
    name: string;
    element?: React.ReactElement<unknown>;
    modelIds?: string[];
    remove?: boolean;
}

const Filter: React.FC<ContentEntriesViewConfigFilterProps> = ({
    name,
    element,
    modelIds = [],
    remove = false
}) => {
    return (
        <Property id={name} name={"filter"} merge={true} remove={remove}>
            <Property id={"name"} name={"name"} value={name} />
            <Property id={"modelIds"} name={"modelIds"} value={modelIds} />
            {element ? <Property id={"element"} name={"element"} value={element} /> : null}
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
        <Property id={name} name={"sorter"} merge={true} remove={remove}>
            <Property id={"name"} name={"name"} value={name} />
            <Property id={"label"} name={"label"} value={label} />
            <Property id={"modelIds"} name={"modelIds"} value={modelIds} />
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
            <PropertyContainer name={"view"} onChange={stateUpdater}>
                <ContentEntriesViewConfigApply />
                <ContentEntriesViewRenderer />
            </PropertyContainer>
        </ViewContext.Provider>
    );
});

export const ContentEntriesViewRenderer = makeComposable("ContentEntriesViewRenderer");

function byName(name: string) {
    return (obj: Property) => obj.name === name;
}

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

export function useContentEntriesViewConfig(): {
    filters: ContentEntriesViewConfigFilter[];
    sorters: ContentEntriesViewConfigSorter[];
} {
    const { properties } = useContext(ViewContext);

    const filters = properties
        .filter(byName("filter"))
        .map(f => toObject<ContentEntriesViewConfigFilter>(f));

    const sorters = properties
        .filter(byName("sorter"))
        .map(f => toObject<ContentEntriesViewConfigSorter>(f));

    return {
        filters,
        sorters
    };
}
