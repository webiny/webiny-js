import React from "react";
import IconPickerComponent from "~/editor/components/IconPicker";
import { PbIcon } from "~/types";
import { Typography } from "@webiny/ui/Typography";
import { Cell } from "@webiny/ui/Grid";
import { IconProp } from "@fortawesome/fontawesome-svg-core";

interface IconPickerProps {
    label: string;
    value: IconProp;
    updateValue: (item: PbIcon) => void;
}

const IconPicker = ({ label, value, updateValue }: IconPickerProps) => {
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
