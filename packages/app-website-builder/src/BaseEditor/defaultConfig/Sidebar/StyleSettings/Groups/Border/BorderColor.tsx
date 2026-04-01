import React from "react";
import { observer } from "mobx-react-lite";
import { ColorPicker } from "@webiny/admin-ui";
import { useStyles } from "../../useStyles.js";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";

interface BorderColorProps {
    elementId: string;
}

export const BorderColor = observer(({ elementId }: BorderColorProps) => {
    const { styles, onChange, onPreviewChange, inheritanceMap } = useStyles(elementId);

    const handleDrag = (value: string) => {
        onPreviewChange(({ styles }) => {
            styles.set("borderColor", value);
        });
    };

    const handleCommit = (value: string) => {
        onChange(({ styles }) => {
            styles.set("borderColor", value);
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("borderColor");
        });
    };

    const inheritance = inheritanceMap?.borderColor ?? {};

    return (
        <ColorPicker
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Border color"}
                />
            }
            description={"Select border color"}
            value={styles.borderColor ?? "transparent"}
            onChange={handleDrag}
            onChangeComplete={handleCommit}
        />
    );
});
