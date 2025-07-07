import React from "react";
import { FormComponentLabel } from "@webiny/admin-ui";
import type { Editor } from "~/index";
import type { IEcommerceApi } from "./types";
import { ResourcesPickerButton } from "./components/ResourcesPicker";

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
            <div className={"wby-w-full"}>
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
