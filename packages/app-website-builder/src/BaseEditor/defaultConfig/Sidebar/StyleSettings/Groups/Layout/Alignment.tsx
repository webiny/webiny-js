import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as AlignToBottom } from "@webiny/icons/vertical_align_bottom.svg";
import { ReactComponent as AlignToTop } from "@webiny/icons/vertical_align_top.svg";
import { ReactComponent as CenterVertically } from "@webiny/icons/vertical_align_center.svg";
import { ReactComponent as AlignLeft } from "@webiny/icons/align_horizontal_left.svg";
import { ReactComponent as AlignRight } from "@webiny/icons/align_horizontal_right.svg";
import { ReactComponent as CenterHorizontally } from "@webiny/icons/align_horizontal_center.svg";
import { useStyles } from "~/BaseEditor/defaultConfig/Sidebar/StyleSettings/useStyles";
import { InheritanceLabel } from "../../../InheritanceLabel";
import { IconButton } from "./IconButton";

const activeVariant = "secondary";
const inactiveVariant = "ghost";

/**
 * Alignment is controlled with margin and display: flex.
 * -----
 * Align to the left => margin-right: auto;
 * Align to the right => margin-left: auto;
 * Center horizontally => margin-left: auto; margin-right: auto;
 * Full width: unset margin-left and margin-right.
 * -----
 * Align to the top => margin-bottom: auto;
 * Align to the bottom => margin-top: auto;
 * Center vertically => margin-top: auto; margin-bottom: auto;
 */
export const Alignment = observer(({ elementId }: { elementId: string }) => {
    const { styles, onChange, inheritanceMap } = useStyles(elementId);

    /**
     * Horizontal alignment
     */
    const onAlignLeft = () => {
        onChange(({ styles }) => {
            styles.set("marginRight", "auto");
            if (styles.get("marginLeft") === "auto") {
                styles.set("marginLeft", "unset");
            }
        });
    };

    const onAlignRight = () => {
        onChange(({ styles }) => {
            styles.set("marginLeft", "auto");
            if (styles.get("marginRight") === "auto") {
                styles.set("marginRight", "unset");
            }
        });
    };

    const onCenterHorizontally = () => {
        onChange(({ styles }) => {
            styles.set("marginLeft", "auto");
            styles.set("marginRight", "auto");
        });
    };

    /**
     * Vertical alignment
     */
    const onAlignTop = () => {
        onChange(({ styles }) => {
            styles.set("marginBottom", "auto");
            if (styles.get("marginTop") === "auto") {
                styles.set("marginTop", "unset");
            }
        });
    };

    const onCenterVertically = () => {
        onChange(({ styles }) => {
            styles.set("marginTop", "auto");
            styles.set("marginBottom", "auto");
        });
    };

    const onAlignBottom = () => {
        onChange(({ styles }) => {
            styles.set("marginTop", "auto");
            if (styles.get("marginBottom") === "auto") {
                styles.set("marginBottom", "unset");
            }
        });
    };

    const onReset = () => {
        onChange(({ styles }) => {
            styles.unset("width");
            styles.unset("marginTop");
            styles.unset("marginRight");
            styles.unset("marginBottom");
            styles.unset("marginLeft");
        });
    };

    const isLeftAligned = styles.marginRight === "auto" && styles.marginLeft !== "auto";
    const isHorizontallyCentered = styles.marginRight === "auto" && styles.marginLeft === "auto";
    const isRightAligned = styles.marginRight !== "auto" && styles.marginLeft === "auto";
    const isAlignedToTop = styles.marginBottom === "auto" && styles.marginTop !== "auto";
    const isAlignedToBottom = styles.marginBottom !== "auto" && styles.marginTop === "auto";
    const isVerticallyCentered = styles.marginBottom === "auto" && styles.marginTop === "auto";

    const isOverridden = [
        inheritanceMap.marginTop,
        inheritanceMap.marginRight,
        inheritanceMap.marginBottom,
        inheritanceMap.marginLeft
    ]
        .filter(Boolean)
        .some(item => item.overridden);

    return (
        <div>
            <InheritanceLabel text={"Align"} onReset={onReset} isOverridden={isOverridden} />
            <div className={"wby-flex wby-flex-row wby-w-full wby-justify-between"}>
                {/* Horizontal Alignment */}
                <IconButton
                    icon={<AlignLeft />}
                    variant={isLeftAligned ? activeVariant : inactiveVariant}
                    onClick={onAlignLeft}
                    tooltip={"Align to the left side"}
                />
                <IconButton
                    icon={<CenterHorizontally />}
                    variant={isHorizontallyCentered ? activeVariant : inactiveVariant}
                    onClick={onCenterHorizontally}
                    tooltip={"Center horizontally"}
                />
                <IconButton
                    icon={<AlignRight />}
                    variant={isRightAligned ? activeVariant : inactiveVariant}
                    onClick={onAlignRight}
                    tooltip={"Align to the right side"}
                />
                {/* Vertical Alignment */}
                <IconButton
                    icon={<AlignToTop />}
                    variant={isAlignedToTop ? activeVariant : inactiveVariant}
                    onClick={onAlignTop}
                    tooltip={"Align to the top side"}
                />
                <IconButton
                    icon={<CenterVertically />}
                    variant={isVerticallyCentered ? activeVariant : inactiveVariant}
                    onClick={onCenterVertically}
                    tooltip={"Center vertically"}
                />
                <IconButton
                    icon={<AlignToBottom />}
                    variant={isAlignedToBottom ? activeVariant : inactiveVariant}
                    onClick={onAlignBottom}
                    tooltip={"Align to the bottom side"}
                />
            </div>
        </div>
    );
});
