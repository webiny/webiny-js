import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUniqueId, toObject } from "./utils";

export interface Property {
    id: string;
    parent: string;
    name: string;
    value?: unknown;
    array?: boolean;
}

function removeByParent(id: string, properties: Property[]): Property[] {
    return properties
        .filter(prop => prop.parent === id)
        .reduce((acc, item) => {
            return removeByParent(
                item.id,
                acc.filter(prop => prop.id !== item.id)
            );
        }, properties);
}

interface AddPropertyOptions {
    after?: string;
    before?: string;
}

interface PropertiesContext {
    properties: Property[];
    getObject<T = unknown>(): T;
    addProperty(property: Property, options?: AddPropertyOptions): void;
    removeProperty(id: string): void;
    replaceProperty(id: string, property: Property): void;
}

function putPropertyBefore(properties: Property[], property: Property, before: string) {
    const existingIndex = properties.findIndex(prop => prop.id === property.id);
    if (existingIndex > -1) {
        const existingProperty = properties[existingIndex];
        const newProperties = properties.filter(p => p.id !== property.id);
        const targetIndex = before.endsWith("$first")
            ? 0
            : newProperties.findIndex(prop => prop.id === before);
        return [
            ...newProperties.slice(0, targetIndex),
            existingProperty,
            ...newProperties.slice(targetIndex)
        ];
    }

    const targetIndex = properties.findIndex(prop => prop.id === before);

    return [...properties.slice(0, targetIndex), property, ...properties.slice(targetIndex)];
}

function putPropertyAfter(properties: Property[], property: Property, after: string) {
    const existingIndex = properties.findIndex(prop => prop.id === property.id);

    if (existingIndex > -1) {
        const [removedProperty] = properties.splice(existingIndex, 1);
        const targetIndex = after.endsWith("$last")
            ? properties.length - 1
            : properties.findIndex(prop => prop.id === after);
        return [
            ...properties.slice(0, targetIndex + 1),
            removedProperty,
            ...properties.slice(targetIndex + 1)
        ];
    }

    const targetIndex = properties.findIndex(prop => prop.id === after);

    return [
        ...properties.slice(0, targetIndex + 1),
        property,
        ...properties.slice(targetIndex + 1)
    ];
}

function mergeProperty(properties: Property[], property: Property) {
    const index = properties.findIndex(prop => prop.id === property.id);
    if (index > -1) {
        return [
            ...properties.slice(0, index),
            { ...properties[index], ...property },
            ...properties.slice(index + 1)
        ];
    }
    return properties;
}

const PropertiesContext = createContext<PropertiesContext | undefined>(undefined);

interface PropertiesProps {
    onChange?(properties: Property[]): void;
    children: React.ReactNode;
}

export const Properties = ({ onChange, children }: PropertiesProps) => {
    const [properties, setProperties] = useState<Property[]>([]);

    useEffect(() => {
        if (onChange) {
            onChange(properties);
        }
    }, [properties]);

    const context: PropertiesContext = useMemo(
        () => ({
            properties,
            getObject<T>() {
                return toObject(properties) as T;
            },
            addProperty(property, options = {}) {
                setProperties(properties => {
                    const index = properties.findIndex(prop => prop.id === property.id);

                    if (index > -1) {
                        const newProperties = mergeProperty(properties, property);
                        if (options.after) {
                            return putPropertyAfter(newProperties, property, options.after);
                        }
                        if (options.before) {
                            return putPropertyBefore(newProperties, property, options.before);
                        }

                        return newProperties;
                    }

                    if (options.after) {
                        return putPropertyAfter(properties, property, options.after);
                    }

                    if (options.before) {
                        return putPropertyBefore(properties, property, options.before);
                    }

                    return [...properties, property];
                });
            },
            removeProperty(id) {
                setProperties(properties => {
                    return removeByParent(
                        id,
                        properties.filter(prop => prop.id !== id)
                    );
                });
            },
            replaceProperty(id, property) {
                setProperties(properties => {
                    const toReplace = properties.findIndex(prop => prop.id === id);

                    if (toReplace > -1) {
                        // Replace the property and remove all remaining child properties.
                        return removeByParent(id, [
                            ...properties.slice(0, toReplace),
                            property,
                            ...properties.slice(toReplace + 1)
                        ]);
                    }
                    return properties;
                });
            }
        }),
        [properties]
    );

    return <PropertiesContext.Provider value={context}>{children}</PropertiesContext.Provider>;
};

export function useProperties() {
    const properties = useContext(PropertiesContext);
    if (!properties) {
        throw Error("Properties context provider is missing!");
    }

    return properties;
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
    const { properties } = useProperties();

    const matchOrGetAncestor = (
        property: Property,
        params: AncestorMatch
    ): Property | undefined => {
        const matchedProps = properties
            .filter(prop => prop.parent === property.id)
            .filter(prop => prop.name in params && prop.value === params[prop.name]);

        if (matchedProps.length === Object.keys(params).length) {
            return property;
        }

        const newParent = property.parent
            ? properties.find(prop => prop.id === property.parent)
            : undefined;

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
    const uniqueId = useMemo(() => id || getUniqueId(), []);
    const parentProperty = useParentProperty();
    const properties = useProperties();

    if (!properties) {
        throw Error("<Properties> provider is missing higher in the hierarchy!");
    }

    const { addProperty, removeProperty, replaceProperty } = properties;
    const parentId = parent ? parent : root ? "" : parentProperty?.id || "";
    const property = { id: uniqueId, name, value, parent: parentId, array };

    useEffect(() => {
        if (remove) {
            removeProperty(uniqueId);
            return;
        }

        if (replace) {
            replaceProperty(replace, property);
            return;
        }

        addProperty(property, { after, before });

        return () => {
            removeProperty(uniqueId);
        };
    }, []);

    if (children) {
        return <PropertyContext.Provider value={property}>{children}</PropertyContext.Provider>;
    }

    return null;
};
