import React from "react";
import { Property } from "@webiny/react-properties";

interface ThemeProps {
    name: string;
    path: string;
    remove?: boolean;
}

export const Theme = ({ name, path, remove }: ThemeProps) => {
    const propertyName = `theme`;
    const id = `${propertyName}.${name}`;
    return (
        <Property id={id} name={propertyName} array root remove={remove}>
            <Property name={"name"} value={name} />
            <Property name={"path"} value={path} />
        </Property>
    );
};

const PublicAsset = ({ name, path, remove }: ThemeProps) => {
    const propertyName = `website.publicAsset`;
    const id = `${propertyName}.${name}`;
    return (
        <Property id={id} name={propertyName} array root remove={remove}>
            <Property name={"path"} value={path} />
        </Property>
    );
};

const Context = ({ name, path, remove }: ThemeProps) => {
    const propertyName = `api.context`;
    const id = `${propertyName}.${name}`;
    return (
        <Property id={id} name={propertyName} array root remove={remove}>
            <Property name={"path"} value={path} />
        </Property>
    );
};

const PageLayout = ({ name, path, remove }: ThemeProps) => {
    const propertyName = `api.context`;
    const id = `${propertyName}.${name}`;
    return (
        <Property id={id} name={propertyName} array root remove={remove}>
            <Property name={"path"} value={path} />
        </Property>
    );
};

const FormLayout = ({ name, path, remove }: ThemeProps) => {
    const propertyName = `api.context`;
    const id = `${propertyName}.${name}`;
    return (
        <Property id={id} name={propertyName} array root remove={remove}>
            <Property name={"path"} value={path} />
        </Property>
    );
};

export const Website = {
    PublicAsset
};

export const Admin = {
    Context
};

export const Api = {
    Context
};

export const Pb = {
    PageLayout
};

export const Fb = {
    FormLayout
};

export abstract class AbstractTheme {
    public abstract readonly id: string;
    public abstract readonly name: string;
    public abstract readonly styles: any;
}

export function createImplementation(baseClass) {
    return baseClass;
}
