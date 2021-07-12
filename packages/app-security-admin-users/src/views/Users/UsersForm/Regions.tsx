import React from "react";
import { plugins } from "@webiny/plugins";
import { BindComponent } from "@webiny/form";
import { UsersFormPlugin } from "~/views/Users/UsersFormPlugin";

interface FormProps {
    Bind: BindComponent;
    data: any;
    children: React.ReactNode;
}

export const Form = (props: FormProps) => {
    const userPlugins = plugins.byType<UsersFormPlugin>(UsersFormPlugin.type);

    return <>{userPlugins.map(pl => pl.renderForm(props))}</>;
};

interface FieldProps {
    grid: number;
    Bind: BindComponent;
    data: any;
    children?: React.ReactNode;
}

export const Fields = (props: FieldProps) => {
    const userPlugins = plugins.byType<UsersFormPlugin>(UsersFormPlugin.type);

    return <>{userPlugins.map(pl => pl.renderFields(props))}</>;
};
