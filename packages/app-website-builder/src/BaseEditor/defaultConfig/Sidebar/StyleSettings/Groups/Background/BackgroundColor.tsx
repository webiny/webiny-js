import React from "react";
import { observer } from "mobx-react-lite";
import { ThemeColorPicker, type ThemeColorSelection } from "@webiny/app-theme";
import { createTokenReference } from "@webiny/website-builder-sdk";

import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles.js";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

export const BackgroundColor = observer(({ elementId }: { elementId: string }) => {
    const { styles, tokens, onChange, inheritanceMap } = useStyles(elementId);

    /**
     * The picker commits on selection rather than on every drag frame, so the local state and
     * debounce this control used to carry are no longer needed — a swatch click is one write.
     */
    const handleChange = (selection: ThemeColorSelection) => {
        onChange(({ styles }) => {
            if (selection.path) {
                styles.setToken(
                    "backgroundColor",
                    createTokenReference(selection.path, selection.value),
                    selection.value
                );
            } else {
                styles.set("backgroundColor", selection.value);
            }
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("backgroundColor");
        });
    };

    const inheritance = inheritanceMap?.backgroundColor ?? {};

    return (
        <SidebarRow
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Color"}
                />
            }
        >
            <ThemeColorPicker
                value={styles.backgroundColor ?? "transparent"}
                tokenPath={tokens.backgroundColor?.path ?? null}
                onChange={handleChange}
            />
        </SidebarRow>
    );
});
