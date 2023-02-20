import * as React from "react";

import { Property, useAncestor, useParentProperty } from "~/index";

interface OperationProps {
    name: string;
    children?: React.ReactNode | React.ReactNode[];
}

export const Query = ({ name, children }: OperationProps) => {
    return (
        <Property id={`query.${name}`} name={"operations"} array>
            <Property id={`query.${name}.type`} name={"type"} value={"query"} />
            <Property id={`query.${name}.operationName`} name={"operationName"} value={name} />
            {children}
        </Property>
    );
};

export const Mutation = ({ name, children }: OperationProps) => {
    return (
        <Property id={`query.${name}`} name={"operations"} array>
            <Property id={`query.${name}.type`} name={"type"} value={"mutation"} />
            <Property id={`query.${name}.operationName`} name={"operationName"} value={name} />
            {children}
        </Property>
    );
};

interface FieldProps {
    name: string;
    alias?: string;
    children?: React.ReactNode | React.ReactNode[];
}

export const Field = ({ name, alias, children }: FieldProps) => {
    const parent = useParentProperty();

    if (!parent) {
        throw Error(`<Field> must be used as a child of <Query> or <Mutation> element.`);
    }

    const getId = (type: string) => {
        return `${parent.id}.selection.${name}.${type}`;
    };

    return (
        <Property id={`${parent.id}.selection.${name}`} name={"selection"} array>
            <Property id={getId("name")} name={"name"} value={name} />
            {alias ? <Property id={getId("alias")} name={"alias"} value={alias} /> : null}
            <Property id={getId("type")} name={"type"} value={"field"} />
            {children}
        </Property>
    );
};

export interface InlineFragment {
    name: string;
    children?: React.ReactNode | React.ReactNode[];
}

export const InlineFragment = ({ name, children }: InlineFragment) => {
    const parent = useParentProperty();

    if (!parent) {
        throw Error(`<InlineFragment> must be used as a child of <Field> element.`);
    }

    const getId = (type: string) => {
        return `${parent.id}.selection.${name}.${type}`;
    };

    return (
        <Field name={name}>
            <Property id={getId("type")} name={"type"} value={"inlineFragment"} />
            {children}
        </Field>
    );
};

interface VariableProps {
    name: string;
    alias?: string;
    type?: string;
    required?: boolean;
}

export const Variable = ({ name, alias, required, type }: VariableProps) => {
    const query = useAncestor({ type: "query" });

    if (!query) {
        return null;
    }

    return (
        <>
            <Property name={"variables"} array>
                <Property name={"name"} value={name} />
                {alias ? <Property name={"alias"} value={alias} /> : null}
                <Property name={"type"} value={type || "String"} />
                <Property name={"required"} value={required ?? false} />
            </Property>
            <Property name={"variables"} array parent={query.id}>
                <Property name={"name"} value={alias || name} />
                <Property name={"type"} value={type || "String"} />
                <Property name={"required"} value={required ?? false} />
            </Property>
        </>
    );
};

export interface Operation {
    type: string;
    operationName: string;
    selection: Selection[];
    variables: Variable[];
}

export interface Selection {
    name: string;
    alias?: string;
    type: string;
    selection: Selection[];
    variables: Variable[];
}

export interface Variable {
    name: string;
    alias?: string;
    type: string;
    required: boolean;
}
