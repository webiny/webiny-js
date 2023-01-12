import React from "react";
import IconPickerComponent from "~/editor/components/IconPicker";
import { PbIcon } from "~/types";
import { Typography } from "@webiny/ui/Typography";
import { Cell } from "@webiny/ui/Grid";

interface IconPickerProps {
    label: string;
    value: [string, string];
    updateValue: (item: PbIcon) => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ label, value, updateValue }) => {
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
