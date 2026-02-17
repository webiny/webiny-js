import * as React from "react";
import type { CmsModelField } from "~/types.js";
import type { BindComponentRenderProp } from "@webiny/form";
import { Input as UiInput, Icon } from "@webiny/admin-ui";

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
            onChange={value => {
                if (props.type === "number") {
                    value = parseFloat(value);
                }
                return bind.onChange(value);
            }}
            label={null}
            note={null}
            description={null}
            placeholder={props.field.placeholder}
            type={props.type}
            endIcon={endIcon}
            data-testid={`fr.input.${props.field.label}`}
        />
    );
};
