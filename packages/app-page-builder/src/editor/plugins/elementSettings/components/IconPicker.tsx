import React from "react";
import IconPickerComponent from "@webiny/app-page-builder/editor/components/IconPicker";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";

type IconPickerProps = {
    label: string;
    value: [string, string];
    updateValue: (value: any) => void;
    removable?: boolean;
    className?: string;
    handlerClassName?: string;
};

const IconPicker: React.FunctionComponent<IconPickerProps> = ({
    label,
    value,
    updateValue,
    removable,
    className
}) => {
    return (
        <Grid className={className}>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <IconPickerComponent value={value} onChange={updateValue} removable={removable} />
            </Cell>
        </Grid>
    );
};

export default React.memo(IconPicker);

const BaseIconPickerComponent: React.FunctionComponent<Partial<IconPickerProps>> = ({
    value,
    updateValue,
    removable,
    handlerClassName
}) => {
    return (
        <IconPickerComponent
            handlerClassName={handlerClassName}
            value={value}
            onChange={updateValue}
            removable={removable}
            useInSidebar={true}
        />
    );
};

export const BaseIconPicker = React.memo(BaseIconPickerComponent);
