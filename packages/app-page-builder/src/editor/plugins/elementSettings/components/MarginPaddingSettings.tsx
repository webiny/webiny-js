import React, { useMemo } from "react";
import { get, startCase } from "lodash";
import { set, merge } from "dot-prop-immutable";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Icons
import { ReactComponent as LinkIcon } from "../../../assets/icons/link.svg";
// Components
import SpacingPicker from "./SpacingPicker";
import {
    COLORS,
    SpacingGrid,
    TopLeft,
    Top,
    TopRight,
    Left,
    Center,
    Right,
    BottomLeft,
    Bottom,
    BottomRight
} from "./StyledComponents";
import Accordion from "./Accordion";
import {
    PbElementDataSettingsPaddingUnitType,
    PbElementDataSettingsMarginUnitType
} from "@webiny/app-page-builder/types";

const classes = {
    gridContainerClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            margin: "16px 0px 24px"
        }
    }),
    wrapper: css({
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
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
        minHeight: 30,

        "& svg": {
            transform: "rotate(135deg)",
            width: 16,
            height: 16
        }
    }),
    linkSettingsActive: css({
        backgroundColor: "var(--mdc-theme-secondary)",
        color: "var(--mdc-theme-on-primary)"
    })
};

/**
 * MarginPaddingSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type PMSettingsPropsType = {
    styleAttribute: "margin" | "padding";
};

type spacingUnitOptionType<T> = {
    label: string;
    value: T;
};
const paddingUnitOptions: spacingUnitOptionType<PbElementDataSettingsPaddingUnitType>[] = [
    {
        label: "%",
        value: "%"
    },
    {
        label: "px",
        value: "px"
    },
    {
        label: "em",
        value: "em"
    },
    {
        label: "vh",
        value: "vh"
    },
    {
        label: "vw",
        value: "vw"
    }
];
const marginUnitOptions: spacingUnitOptionType<PbElementDataSettingsMarginUnitType>[] = [
    {
        label: "%",
        value: "%"
    },
    {
        label: "px",
        value: "px"
    },
    {
        label: "em",
        value: "em"
    },
    {
        label: "vh",
        value: "vh"
    },
    {
        label: "vw",
        value: "vw"
    },
    {
        label: "auto",
        value: "auto"
    }
];

const options = {
    padding: paddingUnitOptions,
    margin: marginUnitOptions
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
            newValue = parseFloat(newValue) || 0;
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

    const updateUnits = (name: string, newValue: any, history = false) => {
        const propName = `${valueKey}.${name}`;

        let newElement = set(element, propName, newValue);

        // Update all values in advanced settings
        if (propName.endsWith(".all")) {
            const prefix = propName.includes("desktop") ? "desktop.units" : "mobile.units";
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

    const getUpdateUnit = useMemo(() => {
        const handlers = {};
        return (name: string) => {
            if (!handlers[name]) {
                handlers[name] = value => updateUnits(name, value, true);
            }

            return handlers[name];
        };
    }, [updateUnits]);

    const toggleAdvanced = useMemo(
        () => event => {
            // Don't need to propagate further.
            event.stopPropagation();
            getUpdateValue("advanced")(!advanced);
        },
        [advanced]
    );

    return (
        <Accordion
            title={startCase(styleAttribute)}
            action={
                <Tooltip content={"link all sides"}>
                    <button
                        className={classNames(classes.linkSettings, {
                            [classes.linkSettingsActive]: !advanced
                        })}
                        onClick={toggleAdvanced}
                    >
                        <LinkIcon />
                    </button>
                </Tooltip>
            }
        >
            <SpacingGrid>
                <TopLeft />
                <Top className="align-center">
                    <SpacingPicker
                        options={options[styleAttribute]}
                        value={get(element, valueKey + ".desktop.top", 0)}
                        onChange={
                            advanced ? getUpdateValue("desktop.top") : getUpdateValue("desktop.all")
                        }
                        unitValue={get(element, valueKey + ".desktop.units.top", "px")}
                        unitOnChange={
                            advanced
                                ? getUpdateUnit("desktop.units.top")
                                : getUpdateUnit("desktop.units.all")
                        }
                    />
                </Top>
                <TopRight />
                <Left>
                    <SpacingPicker
                        options={options[styleAttribute]}
                        disabled={!advanced}
                        value={get(element, valueKey + ".desktop.left", 0)}
                        onChange={getUpdateValue("desktop.left")}
                        unitValue={get(element, valueKey + ".desktop.units.left", "px")}
                        unitOnChange={getUpdateUnit("desktop.units.left")}
                    />
                </Left>
                <Center className="align-center">
                    <Typography className={"text mono"} use={"subtitle2"}>
                        {get(element, "data.settings.width.value", "100%")}
                        &nbsp;x&nbsp;
                        {get(element, "data.settings.height.value", "100%")}
                    </Typography>
                </Center>
                <Right>
                    <SpacingPicker
                        options={options[styleAttribute]}
                        disabled={!advanced}
                        value={get(element, valueKey + ".desktop.right", 0)}
                        onChange={getUpdateValue("desktop.right")}
                        unitValue={get(element, valueKey + ".desktop.units.right", "px")}
                        unitOnChange={getUpdateUnit("desktop.units.right")}
                    />
                </Right>
                <BottomLeft />
                <Bottom className={"align-center"}>
                    <SpacingPicker
                        options={options[styleAttribute]}
                        disabled={!advanced}
                        value={get(element, valueKey + ".desktop.bottom", 0)}
                        onChange={getUpdateValue("desktop.bottom")}
                        unitValue={get(element, valueKey + ".desktop.units.bottom", "px")}
                        unitOnChange={getUpdateUnit("desktop.units.bottom")}
                    />
                </Bottom>
                <BottomRight />
            </SpacingGrid>
        </Accordion>
    );
};

export default React.memo(MarginPaddingSettings);
