import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { getUniqueId, toObject } from "./utils.js";
import { PropertyStore } from "./domain/index.js";
import { usePropertyPriority } from "./PropertyPriority.js";

const PropertiesTargetContext = createContext<string | undefined>(undefined);

export interface ConnectToPropertiesProps {
    name: string;
    children: React.ReactNode;
}

export const ConnectToProperties = ({ name, children }: ConnectToPropertiesProps) => {
    return (
        <PropertiesTargetContext.Provider value={name}>{children}</PropertiesTargetContext.Provider>
    );
};

export interface Property {
    id: string;
    parent: string;
    name: string;
    value?: unknown;
    array?: boolean;
    $isFirst?: boolean;
    $isLast?: boolean;
}

interface AddPropertyOptions {
    after?: string;
    before?: string;
    priority?: number;
}

interface PropertiesContext {
    name?: string;
    store: PropertyStore;
    getAncestor(name: string): PropertiesContext | undefined;
    getObject<T = unknown>(): T;
    addProperty(property: Property, options?: AddPropertyOptions): void;
    removeProperty(id: string): void;
    replaceProperty(id: string, property: Property): void;
}

const PropertiesContext = createContext<PropertiesContext | undefined>(undefined);

interface PropertiesProps {
    name?: string;
    onChange?(properties: Property[]): void;
    children: React.ReactNode;
}

export const Properties = ({ name, onChange, children }: PropertiesProps) => {
    const storeRef = useRef<PropertyStore | null>(null);
    if (!storeRef.current) {
        storeRef.current = new PropertyStore();
    }
    const store = storeRef.current;

    let parent: PropertiesContext;

    try {
        parent = useProperties();
    } catch {
        // Do nothing, if there's no parent.
    }

    useEffect(() => {
        if (!onChange) {
            return;
        }

        return store.subscribe(properties => {
            onChange(properties);
        });
    }, [store, onChange]);

    // Context value is stable — it never changes after mount.
    // Children never re-render due to context changes.
    const context: PropertiesContext = useMemo(
        () => ({
            name,
            store,
            getAncestor(ancestorName: string) {
                if (!parent) {
                    return undefined;
                }

                return parent && parent.name === ancestorName
                    ? parent
                    : parent.getAncestor(ancestorName);
            },
            getObject<T>() {
                return toObject(store.allProperties) as T;
            },
            addProperty(property, options = {}) {
                store.addProperty(property, options);
            },
            removeProperty(id) {
                store.removeProperty(id);
            },
            replaceProperty(id, property) {
                store.replaceProperty(id, property);
            }
        }),
        [store]
    );

    return <PropertiesContext.Provider value={context}>{children}</PropertiesContext.Provider>;
};

export function useProperties() {
    const context = useContext(PropertiesContext);
    if (!context) {
        throw Error("Properties context provider is missing!");
    }

    return context;
}

export function useMaybeProperties() {
    return useContext(PropertiesContext);
}

export function useAncestorByName(name: string | undefined) {
    const parent = useMaybeProperties();

    return useMemo(() => {
        if (!name || !parent) {
            return undefined;
        }

        if (parent.name === name) {
            return parent;
        }

        return parent.getAncestor(name);
    }, [name]);
}

interface PropertyProps {
    id?: string;
    name: string;
    value?: unknown;
    array?: boolean;
    after?: string;
    before?: string;
    replace?: string;
    remove?: boolean;
    parent?: string;
    root?: boolean;
    children?: React.ReactNode;
}

const PropertyContext = createContext<Property | undefined>(undefined);

export function useParentProperty() {
    return useContext(PropertyContext);
}

interface AncestorMatch {
    [key: string]: string | boolean | number | null | undefined;
}

export function useAncestor(params: AncestorMatch) {
    const property = useParentProperty();
    const { store } = useProperties();

    const matchOrGetAncestor = (
        property: Property,
        params: AncestorMatch
    ): Property | undefined => {
        const children = store.getChildrenOf(property.id);
        const matchedProps = children.filter(
            prop => prop.name in params && prop.value === params[prop.name]
        );

        if (matchedProps.length === Object.keys(params).length) {
            return property;
        }

        const newParent = property.parent ? store.getById(property.parent) : undefined;

        return newParent ? matchOrGetAncestor(newParent, params) : undefined;
    };

    return property ? matchOrGetAncestor(property, params) : undefined;
}

export const Property = ({
    id,
    name,
    value,
    children,
    after = undefined,
    before = undefined,
    replace = undefined,
    remove = false,
    array = false,
    root = false,
    parent = undefined
}: PropertyProps) => {
    const targetName = useContext(PropertiesTargetContext);
    const uniqueId = useMemo(() => id || getUniqueId(), []);
    const parentProperty = useParentProperty();
    const immediateProperties = useProperties();
    const ancestorByName = useAncestorByName(targetName);
    const previousValue = useRef(value);
    const priority = usePropertyPriority();

    const properties = targetName && ancestorByName ? ancestorByName : immediateProperties;

    if (!properties) {
        throw Error("<Properties> provider is missing higher in the hierarchy!");
    }

    const { addProperty, removeProperty, replaceProperty, store: propertyStore } = properties;
    const parentId = parent ? parent : root ? "" : parentProperty?.id || "";
    const property = { id: uniqueId, name, value, parent: parentId, array };

    // Register in the synchronous lookup during render so useAncestor can find this property.
    if (!remove) {
        propertyStore.registerLookup(property);
    }

    useEffect(() => {
        if (remove) {
            removeProperty(uniqueId);
            return;
        }

        if (replace) {
            replaceProperty(replace, property);
            return;
        }

        const $isFirst = before === "$first";
        const $isLast = after === "$last";

        addProperty({ ...property, $isFirst, $isLast }, { after, before, priority });

        return () => {
            removeProperty(uniqueId);
        };
    }, []);

    useEffect(() => {
        if (previousValue.current !== value) {
            previousValue.current = value;
            if (!remove && !replace) {
                replaceProperty(uniqueId, property);
            }
        }
    }, [value]);

    if (children) {
        return <PropertyContext.Provider value={property}>{children}</PropertyContext.Provider>;
    }

    return null;
};
