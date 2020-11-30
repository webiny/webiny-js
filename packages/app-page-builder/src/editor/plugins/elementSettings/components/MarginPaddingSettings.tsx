import React, { useMemo } from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { get } from "lodash";
import { set, merge } from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import { IconButton } from "@webiny/ui/Button";
import classNames from "classnames";
import { css } from "emotion";
// Icons
import { ReactComponent as ArrowUpIcon } from "../../../assets/icons/arrow_drop_up.svg";
import { ReactComponent as ArrowDownIcon } from "../../../assets/icons/arrow_drop_down.svg";
import { ReactComponent as LinkIcon } from "../../../assets/icons/link.svg";
// Components
import WrappedInput from "./WrappedInput";

const classes = {
    wrapper: css({
        display: "flex",
        /**
         * We're applying this style here to counter the extra "padding-left"
         * on the "Accordion Item" content.
         */
        marginLeft: -45
    }),
    input: css({
        "& .mdc-text-field__input": {
            padding: "0px !important",
            textAlign: "center"
        }
    }),
    linkSettings: css({
        display: "flex !important",
        height: "56px !important",
        border: "1px solid var(--mdc-theme-on-background) !important",

        "& svg": {
            transform: "rotate(135deg)"
        }
    }),
    linkSettingsActive: css({
        backgroundColor: "var(--mdc-theme-secondary) !important",
        color: "var(--mdc-theme-on-primary) !important"
    }),
    controllerWrapper: css({
        display: "flex",
        flexDirection: "column",

        "& button": {
            border: "1px solid var(--mdc-theme-on-background) !important",
            padding: "0px !important",
            height: "28px !important"
        },
        "&:first-child": {
            borderBottom: "none !important"
        }
    })
};

/**
 * MarginPaddingSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type PMSettingsPropsType = {
    styleAttribute: "margin" | "padding";
};

const MarginPaddingSettings: React.FunctionComponent<PMSettingsPropsType> = ({
    styleAttribute
}) => {
    const handler = useEventActionHandler();

    const valueKey = `data.settings.${styleAttribute}`;
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const advanced = get(element, `${valueKey}.advanced`, false);

    const updateSettings = (name: string, newValue: any, history = false) => {
        const propName = `${valueKey}.${name}`;

        if (name !== "advanced") {
            newValue = parseInt(newValue) || 0;
        }
        // "padding" cannot be negative.
        if (styleAttribute === "padding" && newValue < 0) {
            newValue = 0;
        }

        let newElement = set(element, propName, newValue);

        // Update all values in advanced settings
        if (propName.endsWith(".all")) {
            const prefix = propName.includes("desktop") ? "desktop" : "mobile";
            newElement = merge(newElement, `${valueKey}.${prefix}`, {
                top: newValue,
                right: newValue,
                bottom: newValue,
                left: newValue
            });
        }

        handler.trigger(
            new UpdateElementActionEvent({
                element: newElement,
                history,
                merge: true
            })
        );
    };

    const getUpdateValue = useMemo(() => {
        const handlers = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateSettings(name, value, true);
            }

            return handlers[name];
        };
    }, [updateSettings]);

    const increment = useMemo(
        () => () => {
            if (!advanced) {
                const value = get(element, `${valueKey}.desktop.all`, 0);
                getUpdateValue("desktop.all")(value + 1);
            } else {
                console.log("Cannot use these.");
            }
        },
        [advanced, element]
    );

    const decrement = useMemo(
        () => () => {
            if (!advanced) {
                const value = get(element, `${valueKey}.desktop.all`, 0);
                getUpdateValue("desktop.all")(value - 1);
            } else {
                console.log("Cannot use these.");
            }
        },
        [advanced, element]
    );

    const toggleAdvanced = useMemo(
        () => () => {
            getUpdateValue("advanced")(!advanced);
        },
        [advanced]
    );

    return (
        <div className={classes.wrapper}>
            <WrappedInput
                className={classes.input}
                description={"Top"}
                value={get(element, valueKey + ".desktop.top", 0)}
                onChange={advanced ? getUpdateValue("desktop.top") : getUpdateValue("desktop.all")}
            />
            <div className={classes.controllerWrapper}>
                <IconButton disabled={advanced} onClick={increment} icon={<ArrowUpIcon />} />
                <IconButton disabled={advanced} onClick={decrement} icon={<ArrowDownIcon />} />
            </div>
            <WrappedInput
                disabled={!advanced}
                className={classes.input}
                description={"Right"}
                value={get(element, valueKey + ".desktop.right", 0)}
                onChange={getUpdateValue("desktop.right")}
            />
            <WrappedInput
                disabled={!advanced}
                className={classes.input}
                description={"Bottom"}
                value={get(element, valueKey + ".desktop.bottom", 0)}
                onChange={getUpdateValue("desktop.bottom")}
            />
            <WrappedInput
                disabled={!advanced}
                className={classes.input}
                description={"Left"}
                value={get(element, valueKey + ".desktop.left", 0)}
                onChange={getUpdateValue("desktop.left")}
            />
            <IconButton
                className={classNames(classes.linkSettings, {
                    [classes.linkSettingsActive]: !advanced
                })}
                onClick={toggleAdvanced}
                icon={<LinkIcon />}
            />
        </div>
    );
};

export default React.memo(MarginPaddingSettings);
