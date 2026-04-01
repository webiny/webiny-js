import React from "react";
import { observer } from "mobx-react-lite";
import { Select } from "@webiny/admin-ui";
import { useStyles } from "../../useStyles.js";

const options = [
    { label: "None", value: "none" },
    { label: "Solid", value: "solid" },
    { label: "Dashed", value: "dashed" },
    { label: "Dotted", value: "dotted" },
    { label: "Double", value: "double" }
];

interface BorderStyleProps {
    elementId: string;
}

export const BorderStyle = observer(({ elementId }: BorderStyleProps) => {
    const { styles, onChange } = useStyles(elementId);

    const onValueChange = (value: string) => {
        onChange(({ styles }) => {
            styles.set("borderStyle", value);
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("borderStyle");
        });
    };

    return (
        <Select
            label={"Border style"}
            description={"Select border style"}
            value={styles.borderStyle ?? "none"}
            displayResetAction={false}
            onChange={onValueChange}
            options={options}
        />
    );
});
