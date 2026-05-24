import React from "react";
import { observer } from "mobx-react-lite";
import { LinkedEditing } from "./LinkedEditing.js";
import { useStyles } from "../../useStyles.js";
import { ValueSelector } from "../../ValueSelector.js";
import { useStyleValue } from "../../useStyleValue.js";
import { UnitsOptions } from "../../UnitsOptions.js";

const radiusOptions = UnitsOptions.widthUnits().getOptions();

interface BorderRadiusProps {
    elementId: string;
}

export const BorderRadius = observer(({ elementId }: BorderRadiusProps) => {
    const { onChange, onPreviewChange, metadata } = useStyles(elementId);

    const topLeft = useStyleValue(elementId, "borderTopLeftRadius");
    const topRight = useStyleValue(elementId, "borderTopRightRadius");
    const bottomRight = useStyleValue(elementId, "borderBottomRightRadius");
    const bottomLeft = useStyleValue(elementId, "borderBottomLeftRadius");

    const linked = metadata.get<boolean>("borderRadiusLinkedEditing") ?? true;

    const onToggleLinkedEditing = (linked: boolean) => {
        onChange(({ styles, metadata }) => {
            if (linked) {
                const value = `${topLeft.value ?? 0}${topLeft.unit}`;
                styles.set("borderTopRightRadius", value);
                styles.set("borderBottomRightRadius", value);
                styles.set("borderBottomLeftRadius", value);
            }
            metadata.set("borderRadiusLinkedEditing", linked);
        });
    };

    const onTopLeftChange = (value: string) => {
        if (linked) {
            onChange(({ styles }) => {
                styles.set("borderTopLeftRadius", value);
                styles.set("borderTopRightRadius", value);
                styles.set("borderBottomRightRadius", value);
                styles.set("borderBottomLeftRadius", value);
            });
        } else {
            topLeft.onChange(value);
        }
    };

    const onTopLeftPreviewChange = (value: string) => {
        if (linked) {
            onPreviewChange(({ styles }) => {
                styles.set("borderTopLeftRadius", value);
                styles.set("borderTopRightRadius", value);
                styles.set("borderBottomRightRadius", value);
                styles.set("borderBottomLeftRadius", value);
            });
        } else {
            topLeft.onChangePreview(value);
        }
    };

    const onReset = () => {
        if (linked) {
            onChange(({ styles }) => {
                styles.unset("borderTopLeftRadius");
                styles.unset("borderTopRightRadius");
                styles.unset("borderBottomRightRadius");
                styles.unset("borderBottomLeftRadius");
            });
        } else {
            topLeft.onReset();
        }
    };

    const rowClassname = "flex flex-row w-full justify-center items-center py-xs";

    return (
        <div className="flex flex-col items-center bg-neutral-light text-neutral-strong rounded-lg p-sm">
            {/* Top-left (master when linked) */}
            <div className={"grid grid-cols-3 items-center w-full"}>
                <span className="text-sm">Border radius</span>
                <div className={"flex justify-center"}>
                    <ValueSelector
                        label={linked ? "Border radius" : "Top-left radius"}
                        {...topLeft}
                        onReset={onReset}
                        units={radiusOptions}
                        onChange={onTopLeftChange}
                        onChangePreview={onTopLeftPreviewChange}
                    />
                </div>
                <div className={"flex justify-end"}>
                    <LinkedEditing linked={linked} onToggle={onToggleLinkedEditing} />
                </div>
            </div>

            {/* Center row: bottom-left | box | top-right */}
            <div className={rowClassname} style={{ width: 168, paddingTop: "8px" }}>
                <ValueSelector
                    label={"Bottom-left radius"}
                    {...bottomLeft}
                    units={radiusOptions}
                    disabled={linked}
                />
                <div
                    className="flex border-sm border-neutral-muted bg-neutral-light items-center justify-center"
                    style={{ width: 170, height: 30, borderRadius: 8 }}
                >
                    -
                </div>
                <ValueSelector
                    label={"Top-right radius"}
                    {...topRight}
                    units={radiusOptions}
                    disabled={linked}
                />
            </div>

            {/* Bottom-right */}
            <div className={rowClassname} style={{ padding: "8px 0" }}>
                <ValueSelector
                    label={"Bottom-right radius"}
                    {...bottomRight}
                    units={radiusOptions}
                    disabled={linked}
                />
            </div>
        </div>
    );
});
