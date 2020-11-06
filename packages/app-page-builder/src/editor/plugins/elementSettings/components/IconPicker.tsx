import React from "react";
import IconPickerComponent from "@webiny/app-page-builder/editor/components/IconPicker";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";

type IconPickerProps = {
    label: string;
    value: [string, string];
    updateValue: (value: any) => void;
    removable?: boolean;
};

const IconPicker: React.FunctionComponent<IconPickerProps> = ({
    label,
    value,
    updateValue,
    removable
}) => {
    return (
        <Grid>
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
