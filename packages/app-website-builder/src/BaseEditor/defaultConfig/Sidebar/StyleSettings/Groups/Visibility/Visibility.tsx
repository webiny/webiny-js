import React from "react";
import { observer } from "mobx-react-lite";
import { SegmentedControl } from "@webiny/admin-ui";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.js";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

export interface VisibilityProps {
    elementId: string;
}

const ITEMS = [
    { label: "Visible", value: "show" },
    { label: "Hidden", value: "hide" }
];

export const Visibility = observer(({ elementId }: VisibilityProps) => {
    const { styles, onChange, inheritanceMap } = useStyles(elementId);

    const isVisible = styles.display !== "none";

    const toggleVisibility = (isHidden: boolean) => {
        onChange(({ styles }) => {
            styles.set("display", isHidden ? "none" : "flex");
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("display");
        });
    };

    const inheritance = inheritanceMap.display ?? {};

    return (
        <SidebarRow
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Visibility"}
                />
            }
        >
            <SegmentedControl
                items={ITEMS}
                value={isVisible ? "show" : "hide"}
                onChange={value => toggleVisibility(value === "hide")}
            />
        </SidebarRow>
    );
});
