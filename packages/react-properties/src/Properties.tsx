import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getUniqueId, toObject } from "./utils";

export interface Property {
    id: string;
    parent: string;
    name: string;
    value: unknown;
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

const PropertiesContext = createContext<PropertiesContext | undefined>(undefined);

interface PropertiesProps {
    onChange?(properties: Property[]): void;
}

export const Properties: React.FC<PropertiesProps> = ({ onChange, children }) => {
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
                    // If a property with this ID already exists, merge the two properties.
                    const index = properties.findIndex(prop => prop.id === property.id);
                    if (index > -1) {
                        return [
                            ...properties.slice(0, index),
                            { ...properties[index], ...property },
                            ...properties.slice(index + 1)
                        ];
                    }

                    if (options.after) {
                        const index = properties.findIndex(prop => prop.id === options.after);
                        if (index > -1) {
                            return [
                                ...properties.slice(0, index + 1),
                                property,
                                ...properties.slice(index + 1)
                            ];
                        }
                    }

                    if (options.before) {
                        const index = properties.findIndex(prop => prop.id === options.before);
                        if (index > -1) {
                            return [
                                ...properties.slice(0, index),
                                property,
                                ...properties.slice(index)
                            ];
                        }
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
}

const PropertyContext = createContext<Property | undefined>(undefined);

export function useParentProperty() {
    return useContext(PropertyContext);
}

export const Property: React.FC<PropertyProps> = ({
    id,
    name,
    value,
    children,
    after = undefined,
    before = undefined,
    replace = undefined,
    remove = false,
    array = false
}) => {
    const uniqueId = useMemo(() => id || getUniqueId(), []);
    const parent = useParentProperty();
    const properties = useProperties();

    if (!properties) {
        throw Error("<Properties> provider is missing higher in the hierarchy!");
    }

    const { addProperty, removeProperty, replaceProperty } = properties;
    const property = { id: uniqueId, name, value, parent: parent ? parent.id : "", array };

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
