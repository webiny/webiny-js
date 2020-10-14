import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { Cell } from "@webiny/ui/Grid";
import IconPickerComponent from "@webiny/app-page-builder/editor/components/IconPicker";

type IconPickerProps = {
    label: string;
    value: string;
    updateValue: Function;
};

const IconPicker: React.FunctionComponent<IconPickerProps> = ({ label, value, updateValue }) => {
    return (
        <>
            <Cell span={4}>
                <Typography use={"overline"}>{label}</Typography>
            </Cell>
            <Cell span={8}>
                <IconPickerComponent value={value} onChange={updateValue} />
            </Cell>
        </>
    );
};

export default React.memo(IconPicker);
