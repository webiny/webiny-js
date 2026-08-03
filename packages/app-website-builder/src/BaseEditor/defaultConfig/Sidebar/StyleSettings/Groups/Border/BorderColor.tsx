import React from "react";
import { observer } from "mobx-react-lite";
import { ThemeColorPicker, type ThemeColorSelection } from "@webiny/app-theme";
import { createTokenReference } from "@webiny/website-builder-sdk";
import { useStyles } from "../../useStyles.js";
import { InheritanceLabel } from "~/BaseEditor/defaultConfig/Sidebar/InheritanceLabel.js";
import { SidebarRow } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/SidebarRow.js";

interface BorderColorProps {
    elementId: string;
}

export const BorderColor = observer(({ elementId }: BorderColorProps) => {
    const { styles, tokens, onChange, inheritanceMap } = useStyles(elementId);

    /**
     * Either a token reference or a literal is written, never both — see `tokenBinding.ts` in the
     * SDK for why the CSS variable string itself is deliberately not stored.
     */
    const handleChange = (selection: ThemeColorSelection) => {
        onChange(({ styles }) => {
            if (selection.path) {
                styles.setToken(
                    "borderColor",
                    createTokenReference(selection.path, selection.value),
                    selection.value
                );
            } else {
                styles.set("borderColor", selection.value);
            }
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("borderColor");
        });
    };

    const inheritance = inheritanceMap?.borderColor ?? {};

    return (
        <SidebarRow
            label={
                <InheritanceLabel
                    onReset={onReset}
                    isOverridden={inheritance?.overridden ?? false}
                    inheritedFrom={inheritance?.inheritedFrom}
                    text={"Border color"}
                />
            }
        >
            <ThemeColorPicker
                value={styles.borderColor ?? "transparent"}
                tokenPath={tokens.borderColor?.path ?? null}
                onChange={handleChange}
            />
        </SidebarRow>
    );
});
