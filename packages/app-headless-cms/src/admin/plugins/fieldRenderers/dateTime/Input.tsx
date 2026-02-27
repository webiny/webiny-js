import * as React from "react";
import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput, Icon } from "@webiny/admin-ui";
import { useModelField } from "@webiny/app-headless-cms-common";

export interface TrailingIcon {
    icon: React.ReactNode;
    onClick: any;
}

export interface InputProps {
    step?: number;
    type?: string;
    bind: BindComponentRenderProp;
    field: CmsModelField;
    trailingIcon?: TrailingIcon;
}

export const Input = ({ bind, trailingIcon, ...props }: InputProps) => {
    const { field, permissions } = useModelField();

    const endIcon = React.useMemo(() => {
        if (!trailingIcon) {
            return undefined;
        }

        return (
            <Icon
                label={"Icon"}
                icon={trailingIcon?.icon}
                onClick={trailingIcon?.onClick}
                className={"cursor-pointer"}
            />
        );
    }, [trailingIcon]);

    return (
        <UiInput
            {...props}
            {...bind}
            disabled={!permissions.canEdit}
            onChange={value => {
                if (props.type === "number") {
                    value = parseFloat(value);
                }
                return bind.onChange(value);
            }}
            label={null}
            note={null}
            description={null}
            placeholder={field.placeholder}
            type={props.type}
            endIcon={endIcon}
            data-testid={`fr.input.${field.label}`}
        />
    );
};
