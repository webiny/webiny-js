import React from "react";
import { Property, useIdGenerator } from "@webiny/react-properties";

export interface GroupProps {
    name: string;
    title?: string;
    description?: string;
    icon?: React.ReactNode;
    children?: React.ReactNode;
    remove?: boolean;
    replace?: string;
}

type DynamicProps<T> = T & {
    [key: string]: any;
};

export const Group = ({ children, replace, remove = false, ...rest }: GroupProps) => {
    const props: DynamicProps<typeof rest> = rest;
    const id = `group:${props.name}`;
    const toReplace = replace !== undefined ? `group:${replace}` : undefined;

    return (
        <Property id="pageSettings" name={"pageSettings"}>
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
        </Property>
    );
};

export interface ElementProps {
    name: string;
    element?: JSX.Element;
    after?: string;
    before?: string;
    remove?: boolean;
    replace?: string;
}

export const Element: React.FC<ElementProps> = ({
    after,
    before,
    replace,
    remove = false,
    ...rest
}) => {
    const getId = useIdGenerator("element");
    const props: DynamicProps<typeof rest> = rest;
    const toReplace = replace !== undefined ? getId(replace) : undefined;
    const placeAfter = after !== undefined ? getId(after) : undefined;
    const placeBefore = before !== undefined ? getId(before) : undefined;

    return (
        <Property
            id={getId(props.name)}
            name={"elements"}
            array
            replace={toReplace}
            remove={remove}
            after={placeAfter}
            before={placeBefore}
        >
            {Object.keys(props).map(name => (
                <Property key={name} id={getId(props.name, name)} name={name} value={props[name]} />
            ))}
        </Property>
    );
};

export const PageSettings = {
    Group,
    Element
};
