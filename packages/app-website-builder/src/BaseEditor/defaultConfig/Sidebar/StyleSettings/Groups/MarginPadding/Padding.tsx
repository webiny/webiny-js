import React from "react";
import { observer } from "mobx-react-lite";
import { LinkedEditing } from "./LinkedEditing.js";
import { useStyles } from "../../useStyles.js";
import { ValueSelector } from "../../ValueSelector.js";
import { useStyleValue } from "../../useStyleValue.js";
import { UnitsOptions } from "../../UnitsOptions.js";

const widthOptions = UnitsOptions.widthUnits().getOptions();
const heightOptions = UnitsOptions.heightUnits().getOptions();

interface PaddingProps {
    elementId: string;
}

export const Padding = observer(({ elementId }: PaddingProps) => {
    const { onChange, onPreviewChange, metadata } = useStyles(elementId);

    const paddingTop = useStyleValue(elementId, "paddingTop");
    const paddingRight = useStyleValue(elementId, "paddingRight");
    const paddingBottom = useStyleValue(elementId, "paddingBottom");
    const paddingLeft = useStyleValue(elementId, "paddingLeft");

    const linked = metadata.get<boolean>("paddingLinkedEditing") ?? true;

    const onToggleLinkedEditing = (linked: boolean) => {
        onChange(({ styles, metadata }) => {
            if (linked) {
                const value = `${paddingTop.value ?? 0}${paddingTop.unit}`;
                styles.set("paddingRight", value);
                styles.set("paddingBottom", value);
                styles.set("paddingLeft", value);
            }
            metadata.set("paddingLinkedEditing", linked);
        });
    };

    const onPaddingTopChange = (value: string) => {
        if (linked) {
            onChange(({ styles }) => {
                styles.set("paddingTop", value);
                styles.set("paddingRight", value);
                styles.set("paddingBottom", value);
                styles.set("paddingLeft", value);
            });
        } else {
            paddingTop.onChange(value);
        }
    };

    const onPaddingTopPreviewChange = (value: string) => {
        if (linked) {
            onPreviewChange(({ styles }) => {
                styles.set("paddingTop", value);
                styles.set("paddingRight", value);
                styles.set("paddingBottom", value);
                styles.set("paddingLeft", value);
            });
        } else {
            paddingTop.onChangePreview(value);
        }
    };

    const onReset = () => {
        if (linked) {
            onChange(({ styles }) => {
                styles.unset("paddingTop");
                styles.unset("paddingRight");
                styles.unset("paddingBottom");
                styles.unset("paddingLeft");
            });
        } else {
            paddingTop.onReset();
        }
    };

    const rowClassname = "flex flex-row w-full justify-center items-center py-xs";

    return (
        <div className="flex flex-col items-center bg-neutral-muted border-sm border-neutral-muted relative rounded-md">
            <span className="absolute text-sm" style={{ top: 3, left: 5 }}>
                Padding
            </span>

            <LinkedEditing linked={linked} onToggle={onToggleLinkedEditing} />

            {/* Top Padding */}
            <div className={rowClassname} style={{ paddingTop: "8px" }}>
                <ValueSelector
                    label={"Top padding"}
                    {...paddingTop}
                    onReset={onReset}
                    units={heightOptions}
                    onChange={onPaddingTopChange}
                    onChangePreview={onPaddingTopPreviewChange}
                />
            </div>

            {/* Center Row (Left Padding + Content + Right Padding) */}
            <div className={rowClassname} style={{ width: 168, paddingTop: "8px" }}>
                <ValueSelector
                    label={"Left padding"}
                    {...paddingLeft}
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
                    label={"Right padding"}
                    {...paddingRight}
                    units={widthOptions}
                    disabled={linked}
                />
            </div>

            {/* Bottom Padding */}
            <div className={rowClassname} style={{ padding: "8px 0" }}>
                <ValueSelector
                    label={"Bottom padding"}
                    {...paddingBottom}
                    units={heightOptions}
                    disabled={linked}
                />
            </div>
        </div>
    );
});
