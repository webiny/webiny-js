import React, { useCallback } from "react";
import { createConfigurableView } from "./createConfigurableView";
import { Property, useParentProperty } from "~/index";

interface SettingsGroupProps {
    name: string;
    title?: string;
    icon?: string;
    remove?: boolean;
    replace?: string;
}

type DynamicProps<T> = T & {
    [key: string]: any;
};

const SettingsGroup: React.FC<SettingsGroupProps> = ({
    children,
    replace,
    remove = false,
    ...rest
}) => {
    const props: DynamicProps<typeof rest> = rest;
    const id = `group:${props.name}`;
    const toReplace = replace !== undefined ? `group:${replace}` : undefined;

    return (
        <Property id={id} name={"groups"} array remove={remove} replace={toReplace}>
            {Object.keys(props).map(name => (
                <Property
                    key={name}
                    id={`group:${props.name}:${name}`}
                    name={name}
                    value={props[name]}
                />
            ))}
            {children}
        </Property>
    );
};

interface FormFieldProps extends Record<string, unknown> {
    name: string;
    component?: string;
    after?: string;
    remove?: boolean;
    replace?: string;
}

const FormField: React.FC<FormFieldProps> = ({
    children,
    after,
    before,
    replace,
    remove = false,
    ...props
}) => {
    const parent = useParentProperty();
    if (!parent) {
        throw Error(`<FormField> must be a child of a <SettingsGroup> element.`);
    }

    const { id } = parent;

    const getId = useCallback(
        (suffix = undefined) => [id, "field", props.name, suffix].filter(Boolean).join(":"),
        []
    );

    const toReplace = replace !== undefined ? `${id}:field:${replace}` : undefined;
    const placeAfter = after !== undefined ? `${id}:field:${after}` : undefined;
    const placeBefore = before !== undefined ? `${id}:field:${before}` : undefined;

    return (
        <Property
            id={getId()}
            name={"fields"}
            array
            replace={toReplace}
            remove={remove}
            after={placeAfter}
            before={placeBefore}
        >
            {Object.keys(props).map(name => (
                <Property key={name} id={getId(name)} name={name} value={props[name]} />
            ))}
            {children}
        </Property>
    );
};

// Base view components.
const { View, Config } = createConfigurableView("PageSettings");

// Create a named alias.
const PageSettingsView = View;

// Assign custom components
const PageSettingsConfig = Object.assign(Config, { FormField, SettingsGroup });

export { PageSettingsView, PageSettingsConfig };
