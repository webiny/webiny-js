import React, { useMemo } from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { get } from "lodash";
import { set, merge } from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import { css } from "emotion";
// Icons
import { ReactComponent as LinkIcon } from "../../../assets/icons/link.svg";
// Components
import InputField from "./InputField";
import { COLORS } from "./StyledComponents";

const classes = {
    wrapper: css({
        display: "flex"
    }),
    input: css({
        "& .mdc-text-field__input": {
            padding: "0px !important",
            textAlign: "center"
        }
    }),
    linkSettings: css({
        display: "flex",
        alignItems: "center",
        border: `1px solid ${COLORS.gray}`,
        padding: "0px 5px",

        "& svg": {
            transform: "rotate(135deg)",
            width: 16,
            height: 16
        }
    }),
    linkSettingsActive: css({
        backgroundColor: "var(--mdc-theme-secondary)",
        color: "var(--mdc-theme-on-primary)"
    }),
    controllerWrapper: css({
        display: "flex",
        flexDirection: "column",

        "& button": {
            color: COLORS.darkGray,
            border: "1px solid var(--mdc-theme-on-background)",
            padding: "0px",
            width: 15,
            height: 15,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",

            "&:focus": {
                color: "var(--mdc-theme-primary)"
            },
            "&:disabled": {
                cursor: "not-allowed"
            }
        },
        "&:first-child": {
            borderBottom: "none !important"
        },

        "& .arrow-down": {
            // Arrow down.
            borderTop: "5px solid currentColor",
            borderBottom: 0,
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent"
        },
        "& .arrow-up": {
            // Arrow down.
            borderTop: 0,
            borderBottom: "5px solid currentColor",
            borderLeft: "5px solid transparent",
            borderRight: "5px solid transparent"
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
            <InputField
                className={classes.input}
                description={"Top"}
                value={get(element, valueKey + ".desktop.top", 0)}
                onChange={advanced ? getUpdateValue("desktop.top") : getUpdateValue("desktop.all")}
            />
            <div className={classes.controllerWrapper}>
                <button disabled={advanced} onClick={increment}>
                    <div className={"arrow-up"} />
                </button>
                <button disabled={advanced} onClick={decrement}>
                    <div className={"arrow-down"} />
                </button>
            </div>
            <InputField
                disabled={!advanced}
                className={classes.input}
                description={"Right"}
                value={get(element, valueKey + ".desktop.right", 0)}
                onChange={getUpdateValue("desktop.right")}
            />
            <InputField
                disabled={!advanced}
                className={classes.input}
                description={"Bottom"}
                value={get(element, valueKey + ".desktop.bottom", 0)}
                onChange={getUpdateValue("desktop.bottom")}
            />
            <InputField
                disabled={!advanced}
                className={classes.input}
                description={"Left"}
                value={get(element, valueKey + ".desktop.left", 0)}
                onChange={getUpdateValue("desktop.left")}
            />
            <button
                className={classNames(classes.linkSettings, {
                    [classes.linkSettingsActive]: !advanced
                })}
                onClick={toggleAdvanced}
            >
                <LinkIcon />
            </button>
        </div>
    );
};

export default React.memo(MarginPaddingSettings);
