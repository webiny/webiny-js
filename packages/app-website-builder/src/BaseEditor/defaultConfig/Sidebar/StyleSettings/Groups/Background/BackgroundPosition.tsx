import React, { useEffect, useMemo, useState } from "react";
import { Select } from "@webiny/admin-ui";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles";
import { BackgroundImageParser } from "./BackgroundImageParser";
import { toTitleCaseLabel } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/Groups/Background/toTitleCaseLabel";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel";

const POSITIONS = [
    "top left",
    "top",
    "top right",
    "center left",
    "center",
    "center right",
    "bottom left",
    "bottom center",
    "bottom right"
];

const options = POSITIONS.map(key => ({ label: toTitleCaseLabel(key), value: key }));

export const BackgroundPosition = ({ elementId }: { elementId: string }) => {
    const { styles, onChange, inheritanceMap } = useStyles(elementId);
    const [localValue, setLocalValue] = useState<string>(styles.backgroundPosition);
    const hasBackgroundImage = useMemo(() => {
        const parser = new BackgroundImageParser(styles.backgroundImage);
        return parser.getRules().find(r => r.type === "url") !== undefined;
    }, [styles.backgroundImage]);

    useEffect(() => {
        if (styles.backgroundPosition !== localValue) {
            setLocalValue(styles.backgroundPosition);
        }
    }, [styles.backgroundPosition]);

    const onPositionChange = (value: string) => {
        onChange(({ styles }) => {
            styles.set("backgroundPosition", value);
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("backgroundPosition");
        });
    };

    const inheritance = inheritanceMap?.backgroundPosition ?? {};

    return (
        <Select
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Position"}
                />
            }
            description={"Select background position"}
            disabled={!hasBackgroundImage}
            value={localValue ?? "center"}
            displayResetAction={false}
            onChange={onPositionChange}
            options={options}
        />
    );
};
