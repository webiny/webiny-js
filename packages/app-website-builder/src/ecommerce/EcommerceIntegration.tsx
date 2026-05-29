import React, { useEffect, useMemo } from "react";
import { useContainer } from "@webiny/app";
import { Editor } from "~/index.js";
import type {
    IEcommerceApi,
    IEcommerceApiFactory,
    SettingsInput as ISettingsInput,
    Resource as IResource
} from "./types.js";
import { CreateInputRenderers } from "./CreateInputRenderers.js";
import type { EcommerceResourcePageTypeConfig } from "./components/ResourcePage.js";
import {
    EcommerceResourcePageType,
    createResourcePickerRenderer
} from "./components/ResourcePage.js";
import { AdminConfig } from "@webiny/app-admin";
import { createGenericContext } from "@webiny/app";
import {
    EcommerceApiManifest,
    EcommerceApiProviderAbstraction,
    useEcommerceApiProvider
} from "~/features/index.js";
import { PageType as PageTypeAbstraction } from "~/presentation/pages/CreatePage/abstractions.js";
import { createPageTypeRemovalDecorator } from "~/presentation/pages/CreatePage/PageTypeProvider.js";

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
    const container = useContainer();

    useMemo(() => {
        container.registerInstance(EcommerceApiProviderAbstraction, provider);
    }, []);

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

export type PageTypeProps =
    | (Omit<EcommerceResourcePageTypeConfig, "apiName"> & { remove?: never })
    | { name: string; remove: true };

const PageType = (props: PageTypeProps) => {
    const { pluginName } = Context.useHook();
    const container = useContainer();
    const provider = useEcommerceApiProvider();

    const renderer = useMemo(() => {
        if (props.remove) {
            container.registerDecorator(createPageTypeRemovalDecorator(props.name));
            return undefined;
        }

        const pageType = new EcommerceResourcePageType({ ...props, apiName: pluginName }, provider);
        container.registerInstance(PageTypeAbstraction, pageType);

        return createResourcePickerRenderer({
            pluginName,
            resourceType: props.resourceType
        });
    }, []);

    if (!renderer) {
        return null;
    }

    return (
        <AdminConfig>
            <AdminConfig.Form.FieldRenderer
                name={`resource-picker:${pluginName}`}
                component={renderer}
            />
        </AdminConfig>
    );
};

export const EcommerceIntegration = Object.assign(EcommerceIntegrationBase, { PageType });

export namespace EcommerceIntegration {
    export type Props = EcommerceIntegrationProps;
    export type EcommerceApi = IEcommerceApi;
    export type EcommerceApiFactory = IEcommerceApiFactory;
    export type SettingsInput = ISettingsInput;
    export type Resource = IResource;
}
