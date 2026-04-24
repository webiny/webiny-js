import React from "react";
import { observer } from "mobx-react-lite";
import { LinkedEditing } from "./LinkedEditing.js";
import { useStyles } from "../../useStyles.js";
import { ValueSelector } from "../../ValueSelector.js";
import { useStyleValue } from "../../useStyleValue.js";
import { UnitsOptions } from "../../UnitsOptions.js";

const widthOptions = UnitsOptions.widthUnits().getOptions();
const heightOptions = UnitsOptions.heightUnits().getOptions();

interface BorderWidthProps {
    elementId: string;
}

export const BorderWidth = observer(({ elementId }: BorderWidthProps) => {
    const { onChange, onPreviewChange, metadata } = useStyles(elementId);

    const borderTopWidth = useStyleValue(elementId, "borderTopWidth");
    const borderRightWidth = useStyleValue(elementId, "borderRightWidth");
    const borderBottomWidth = useStyleValue(elementId, "borderBottomWidth");
    const borderLeftWidth = useStyleValue(elementId, "borderLeftWidth");

    const linked = metadata.get<boolean>("borderWidthLinkedEditing") ?? true;

    const onToggleLinkedEditing = (linked: boolean) => {
        onChange(({ styles, metadata }) => {
            if (linked) {
                const value = `${borderTopWidth.value ?? 0}${borderTopWidth.unit}`;
                styles.set("borderRightWidth", value);
                styles.set("borderBottomWidth", value);
                styles.set("borderLeftWidth", value);
            }
            metadata.set("borderWidthLinkedEditing", linked);
        });
    };

    const onBorderTopWidthChange = (value: string) => {
        if (linked) {
            onChange(({ styles }) => {
                styles.set("borderTopWidth", value);
                styles.set("borderRightWidth", value);
                styles.set("borderBottomWidth", value);
                styles.set("borderLeftWidth", value);
            });
        } else {
            borderTopWidth.onChange(value);
        }
    };

    const onBorderTopWidthPreviewChange = (value: string) => {
        if (linked) {
            onPreviewChange(({ styles }) => {
                styles.set("borderTopWidth", value);
                styles.set("borderRightWidth", value);
                styles.set("borderBottomWidth", value);
                styles.set("borderLeftWidth", value);
            });
        } else {
            borderTopWidth.onChangePreview(value);
        }
    };

    const onReset = () => {
        if (linked) {
            onChange(({ styles }) => {
                styles.unset("borderTopWidth");
                styles.unset("borderRightWidth");
                styles.unset("borderBottomWidth");
                styles.unset("borderLeftWidth");
            });
        } else {
            borderTopWidth.onReset();
        }
    };

    const rowClassname = "flex flex-row w-full justify-center items-center py-xs";

    return (
        <div className="flex flex-col items-center bg-neutral-light border-sm border-neutral-muted relative rounded-md">
            <span className="absolute text-sm" style={{ top: 3, left: 5 }}>
                Border width
            </span>

            <LinkedEditing linked={linked} onToggle={onToggleLinkedEditing} />

            {/* Top border width */}
            <div className={rowClassname} style={{ paddingTop: "8px" }}>
                <ValueSelector
                    label={linked ? "Border width" : "Top border width"}
                    {...borderTopWidth}
                    onReset={onReset}
                    units={heightOptions}
                    onChange={onBorderTopWidthChange}
                    onChangePreview={onBorderTopWidthPreviewChange}
                />
            </div>

            {/* Center Row (Left + placeholder + Right) */}
            <div className={rowClassname} style={{ width: 168, paddingTop: "8px" }}>
                <ValueSelector
                    label={"Left border width"}
                    {...borderLeftWidth}
                    units={widthOptions}
                    disabled={linked}
                />
                <div
                    className="flex border-sm border-neutral-muted bg-neutral-light rounded-md items-center justify-center"
                    style={{ width: 170, height: 30 }}
                >
                    -
                </div>
                <ValueSelector
                    label={"Right border width"}
                    {...borderRightWidth}
                    units={widthOptions}
                    disabled={linked}
                />
            </div>

            {/* Bottom border width */}
            <div className={rowClassname} style={{ padding: "8px 0" }}>
                <ValueSelector
                    label={"Bottom border width"}
                    {...borderBottomWidth}
                    units={heightOptions}
                    disabled={linked}
                />
            </div>
        </div>
    );
});
