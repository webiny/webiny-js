// @ts-nocheck
/**
 * Note by @pavel910:
 *
 * TS is disabled in this file, as this is a wild experiment, and I need to come back and fix some types, which are not very
 * obvious. I don't have time to do it right now. If the experiment is successful, I'll come back and clean this up, and
 * extract this whole logic into a separate package, as this is a tiny framework for building data objects using React, and
 * we might want to use it in many more places (all views, Page Builder Editor, etc.).
 *
 * More on this a bit later, if the experiment is successful.
 */
import React, { createContext, FC, useContext, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import useDeepCompareEffect from "use-deep-compare-effect";

export function toObject<T = unknown>(property: Property): T {
    if (property.value !== undefined) {
        return { [property.name]: property.value };
    }

    const obj = {};
    property.properties.forEach(prop => {
        // Check if this is a single occurrence of this property
        const isSingle = property.properties.filter(p => p.name === prop.name).length === 1;
        if (prop.value !== undefined) {
            obj[prop.name] = isSingle ? prop.value : [...(obj[prop.name] || []), prop.value];
        } else {
            const asObject = toObject(prop);

            if (!isSingle) {
                obj[prop.name] = [...(obj[prop.name] || []), asObject[prop.name]];
            } else {
                obj[prop.name] = asObject[prop.name];
            }
        }
    });

    return obj;
}

export function toArray(objects: Property[]) {
    return objects.map(obj =>
        obj.properties.reduce((acc, item) => {
            return { ...acc, ...toObject(item) };
        }, {})
    );
}

function mergeProperties(properties1: Property[], properties2: Property[]) {
    const temp: Property[] = [...properties1, ...properties2];

    return Object.values(
        temp.reduce((acc, item) => {
            return { ...acc, [item.id]: item };
        }, {})
    );
}

interface PropertyContext {
    removeProperty(id: string): void;
    updateProperty(property: Property): void;
}

const PropertyContext = createContext<PropertyContext>(null);
PropertyContext.displayName = "PropertyContext";

const useProperty = () => {
    return useContext(PropertyContext);
};

interface PropertyContainerContext {
    updateContainer(update): void;
}

export interface Property<TValue = unknown> {
    id?: string;
    name: string;
    value?: TValue;
    properties?: Property[];
}

const PropertyContainerContext = createContext<PropertyContainerContext>();

function cleanup(properties: Property[]): Property[] {
    return properties
        .map(property => {
            if ("$remove" in property) {
                return null;
            }

            return {
                ...property,
                properties: cleanup(property.properties)
            };
        })
        .filter(Boolean);
}

const store = new Map<string, any>();

interface PropertyContainerProps {
    name: string;
    // TODO: create a proper type
    onChange: any;
}

export const PropertyContainer: FC<PropertyContainerProps> = ({ name, onChange, children }) => {
    const ref = useRef(store);
    const context = useMemo(
        () => ({
            updateContainer(updater) {
                const current = store.get(name) || [];
                const properties = cleanup(updater(current));
                store.set(name, properties);
                onChange(properties);
            }
        }),
        [ref]
    );

    return (
        <PropertyContainerContext.Provider value={context}>
            {children}
        </PropertyContainerContext.Provider>
    );
};

interface PropertyProps {
    id?: string;
    name: string;
    value?: unknown;
    merge?: boolean;
    replace?: boolean;
    remove?: boolean;
}

export const Property: FC<PropertyProps> = ({ children, name, value, ...props }) => {
    const id = useRef(props.id || nanoid());
    const [properties, setProperties] = useState([]);
    const { updateContainer } = useContext(PropertyContainerContext);
    const parentProperty = useProperty();

    const context: PropertyContext = {
        removeProperty(id: string) {
            setProperties(properties => {
                const index = properties.findIndex(p => p.id === id);
                if (index > -1) {
                    return [
                        ...properties.slice(0, index),
                        { ...properties[index], $remove: true },
                        ...properties.slice(index + 1)
                    ];
                }
                return properties;
            });
        },
        updateProperty(property) {
            setProperties(properties => {
                const index = properties.findIndex(p => p.id === property.id);
                if (index > -1) {
                    return [
                        ...properties.slice(0, index),
                        { ...properties[index], ...property },
                        ...properties.slice(index + 1)
                    ];
                }
                return [...properties, property];
            });
        }
    };

    const indexById = p => p.id === props.id;
    const indexByName = p => p.name === name;

    const updateParentContainer = property => {
        updateContainer((properties: Property[]) => {
            // Check if this property already exists in the parent container.
            const index = properties.findIndex(props.id ? indexById : indexByName);

            if (props.remove) {
                if (index > -1) {
                    return [
                        ...properties.slice(0, index),
                        { ...properties[index], $remove: true },
                        ...properties.slice(index + 1)
                    ];
                }

                return properties;
            }

            if (props.replace) {
                if (index > -1) {
                    return [
                        ...properties.slice(0, index),
                        { ...property },
                        ...properties.slice(index + 1)
                    ];
                }

                return [...properties, property];
            }

            if (props.merge) {
                if (index > -1) {
                    return [
                        ...properties.slice(0, index),
                        {
                            ...properties[index],
                            ...property,
                            properties: mergeProperties(
                                properties[index].properties,
                                property.properties
                            )
                        },
                        ...properties.slice(index + 1)
                    ];
                }
            }

            return [...properties, property];
        });
    };

    useDeepCompareEffect(() => {
        const property = { id: id.current, name, value, properties };

        if (!parentProperty) {
            return updateParentContainer(property);
        }

        parentProperty.updateProperty(property);
    }, [properties]);

    useDeepCompareEffect(() => {
        // On mount, we need to report to our parent.
        if (parentProperty) {
            if (props.remove) {
                parentProperty.removeProperty(id.current);
            } else {
                parentProperty.updateProperty({ id: id.current, name, value, properties });
            }
        }
    }, [props.remove, properties]);

    if (!children) {
        return null;
    }

    return <PropertyContext.Provider value={context}>{children}</PropertyContext.Provider>;
};
