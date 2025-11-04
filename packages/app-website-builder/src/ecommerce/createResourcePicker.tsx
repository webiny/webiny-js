import React from "react";
import { FormComponentLabel } from "@webiny/admin-ui";
import type { Editor } from "~/index.js";
import type { IEcommerceApi } from "./types.js";
import { ResourcesPickerButton } from "./components/ResourcesPicker.js";

export const createResourcePicker = (
    pluginName: string,
    api: IEcommerceApi,
    resourceName: string
) => {
    const SingleResourcePicker = (props: Editor.ElementInputRendererProps) => {
        const onChange = (newValue: unknown) => {
            props.onChange(({ value }) => {
                value.set(newValue);
            });
        };
        return (
            <div className={"w-full"}>
                <FormComponentLabel text={props.label} />
                <ResourcesPickerButton
                    api={api}
                    resourceName={resourceName}
                    pluginName={pluginName}
                    value={props.value}
                    onChange={onChange}
                />
            </div>
        );
    };

    SingleResourcePicker.displayName = `${pluginName}${resourceName}`;

    return SingleResourcePicker;
};
