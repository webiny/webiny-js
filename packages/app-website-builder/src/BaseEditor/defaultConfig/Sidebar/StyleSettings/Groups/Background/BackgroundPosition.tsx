import React, { useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { Select } from "@webiny/admin-ui";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.js";
import { BackgroundImageParser } from "./BackgroundImageParser.js";
import { toTitleCaseLabel } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/Groups/Background/toTitleCaseLabel.js";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

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

export const BackgroundPosition = observer(({ elementId }: { elementId: string }) => {
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
        <SidebarRow
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Position"}
                />
            }
        >
            <Select
                size={"md"}
                variant={"secondary"}
                disabled={!hasBackgroundImage}
                value={localValue ?? "center"}
                displayResetAction={false}
                onChange={onPositionChange}
                options={options}
            />
        </SidebarRow>
    );
});
