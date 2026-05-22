import React from "react";
import { observer } from "mobx-react-lite";
import { useStyles } from "../../useStyles.js";
import { LinkedEditing } from "./LinkedEditing.js";
import { ValueSelector } from "../../ValueSelector.js";
import { UnitsOptions } from "../../UnitsOptions.js";
import { useStyleValue } from "../../useStyleValue.js";
import { cn } from "@webiny/admin-ui";

const additionalUnits = ["auto", "unset"];

const widthOptions = UnitsOptions.widthUnits()
    .add(...additionalUnits)
    .getOptions();

const heightOptions = UnitsOptions.heightUnits()
    .add(...additionalUnits)
    .getOptions();

interface MarginProps {
    elementId: string;
    children: React.ReactNode;
}

export const Margin = observer(({ elementId, children }: MarginProps) => {
    const { onChange, onPreviewChange, metadata } = useStyles(elementId);

    const marginTop = useStyleValue(elementId, "marginTop");
    const marginRight = useStyleValue(elementId, "marginRight");
    const marginBottom = useStyleValue(elementId, "marginBottom");
    const marginLeft = useStyleValue(elementId, "marginLeft");

    const linked = metadata.get<boolean>("marginLinkedEditing") ?? true;

    const onToggleLinkedEditing = (linked: boolean) => {
        onChange(({ styles, metadata }) => {
            if (linked) {
                const isKeyword = marginTop.isKeyword;
                const value = isKeyword
                    ? marginTop.value
                    : `${marginTop.value ?? 0}${marginTop.unit}`;
                styles.set("marginRight", value);
                styles.set("marginBottom", value);
                styles.set("marginLeft", value);
            }
            metadata.set("marginLinkedEditing", linked);
        });
    };

    const onMarginTopChange = (value: string) => {
        if (linked) {
            onChange(({ styles }) => {
                styles.set("marginTop", value);
                styles.set("marginRight", value);
                styles.set("marginBottom", value);
                styles.set("marginLeft", value);
            });
        } else {
            marginTop.onChange(value);
        }
    };

    const onMarginTopPreviewChange = (value: string) => {
        if (linked) {
            onPreviewChange(({ styles }) => {
                styles.set("marginTop", value);
                styles.set("marginRight", value);
                styles.set("marginBottom", value);
                styles.set("marginLeft", value);
            });
        } else {
            marginTop.onChangePreview(value);
        }
    };

    const onReset = () => {
        if (linked) {
            onChange(({ styles }) => {
                styles.unset("marginTop");
                styles.unset("marginRight");
                styles.unset("marginBottom");
                styles.unset("marginLeft");
            });
        } else {
            marginTop.onReset();
        }
    };

    const rowClassname = "flex flex-row w-full justify-center items-center";

    return (
        <>
                {/* Top Margin */}
            <div className={"grid grid-cols-3 items-center"}>
                <span className="text-sm text-neutral-strong">Margin</span>

                <div className={"flex justify-center"}>
                    <ValueSelector
                        label={linked ? "Margin" : "Top margin"}
                        {...marginTop}
                        onReset={onReset}
                        units={heightOptions}
                        onChange={onMarginTopChange}
                        onChangePreview={onMarginTopPreviewChange}
                    />
                </div>

                <div className={"flex justify-end"}>
                    <LinkedEditing linked={linked} onToggle={onToggleLinkedEditing} />
                </div>
            </div>

            {/* Middle Row (Left Margin + Padding Box + Right Margin) */}
            <div className={rowClassname}>
                <ValueSelector
                    label={"Left margin"}
                    {...marginLeft}
                    units={widthOptions}
                    disabled={linked}
                />
                {children}
                <ValueSelector
                    label={"Right margin"}
                    {...marginRight}
                    units={widthOptions}
                    disabled={linked}
                />
            </div>

            {/* Bottom Margin */}
            <div className={rowClassname}>
                <ValueSelector
                    label={"Bottom margin"}
                    {...marginBottom}
                    units={heightOptions}
                    disabled={linked}
                />
            </div>
        </>
    );
});
