import React from "react";
import { FormComponentLabel } from "@webiny/admin-ui";
import type { Editor } from "~/index.js";
import type { IEcommerceApi } from "./types.js";
import { PickResourcesListButton } from "./components/ResourcesList.js";

export const createResourceListPicker = (
    pluginName: string,
    api: IEcommerceApi,
    resourceName: string
) => {
    const ListResourcePicker = (props: Editor.ElementInputRendererProps) => {
        const onChange = (newValue: unknown) => {
            props.onChange(({ value }) => {
                value.set(newValue);
            });
        };

        return (
            <div className={"w-full"}>
                <FormComponentLabel text={props.label} />
                <PickResourcesListButton
                    api={api}
                    resourceName={resourceName}
                    pluginName={pluginName}
                    value={props.value}
                    onChange={onChange}
                />
            </div>
        );
    };

    ListResourcePicker.displayName = `${pluginName}${resourceName}List`;

    return ListResourcePicker;
};
