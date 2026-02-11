import React, { useEffect } from "react";
import { Editor } from "~/index.js";
import type {
    IEcommerceApi,
    IEcommerceApiFactory,
    SettingsInput as ISettingsInput
} from "./types.js";
import { CreateInputRenderers } from "./CreateInputRenderers.js";
import type { ResourcePageProps } from "./components/ResourcePage.js";
import { ResourcePage } from "./components/ResourcePage.js";
import { createGenericContext } from "@webiny/app";
import { EcommerceApiManifest, useEcommerceApiProvider, usePageTypes } from "~/features/index.js";

export interface CustomResourcePickerProps<T = any> {
    value?: T;
    onChange(val: T | undefined): void;
}

export type EcommerceIntegrationProps = {
    name: string;
    init: IEcommerceApiFactory;
    settings: ISettingsInput[];
    children?: React.ReactNode;
};

const Context = createGenericContext<{ pluginName: string }>("EcommerceIntegrationContext");

const EcommerceIntegrationBase = (props: EcommerceIntegrationProps) => {
    const provider = useEcommerceApiProvider();

    useEffect(() => {
        provider.addApiManifest(new EcommerceApiManifest(props.name, props.init, props.settings));
    }, []);

    return (
        <Context.Provider pluginName={props.name}>
            <Editor.EditorConfig priority={"secondary"}>
                <CreateInputRenderers pluginName={props.name} />
            </Editor.EditorConfig>
            {props.children}
        </Context.Provider>
    );
};

export type PageTypeProps = Omit<ResourcePageProps, "apiName">;

const PageType = (props: PageTypeProps) => {
    const { pluginName } = Context.useHook();
    const { addPageType } = usePageTypes();

    useEffect(() => {
        addPageType({
            name: props.name,
            label: props.label,
            element: <ResourcePage {...props} apiName={pluginName} />
        });
    }, []);

    return null;
};

export const EcommerceIntegration = Object.assign(EcommerceIntegrationBase, { PageType });

export namespace EcommerceIntegration {
    export type Props = EcommerceIntegrationProps;
    export type EcommerceApi = IEcommerceApi;
    export type EcommerceApiFactory = IEcommerceApiFactory;
    export type SettingsInput = ISettingsInput;
}
