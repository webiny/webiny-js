import React, { useCallback, useMemo } from "react";
import { get, set, startCase } from "lodash";
import { useRecoilValue } from "recoil";
import classNames from "classnames";
import { css } from "emotion";
import { Typography } from "@webiny/ui/Typography";
import { Tooltip } from "@webiny/ui/Tooltip";
import { PbEditorPageElementSettingsRenderComponentProps } from "../../../../types";
import { activeElementWithChildrenSelector, uiAtom } from "../../../recoil/modules";
import useUpdateHandlers, { PostModifyElementArgs } from "../useUpdateHandlers";
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

const paddingUnitOptions = [
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
const marginUnitOptions = [
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

const SIDES = ["top", "right", "bottom", "left"];
const DEFAULT_VALUE = "0px";

const MarginPaddingSettings: React.FunctionComponent<PMSettingsPropsType &
    PbEditorPageElementSettingsRenderComponentProps> = ({
    styleAttribute,
    defaultAccordionValue
}) => {
    const valueKey = `data.settings.${styleAttribute}`;
    const { editorMode } = useRecoilValue(uiAtom);
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const advanced = get(element, `${valueKey}.${editorMode}.advanced`, false);

    const { getUpdateValue } = useUpdateHandlers({
        element,
        dataNamespace: valueKey,
        postModifyElement: ({ name, newElement, newValue }: PostModifyElementArgs) => {
            // Bail out early if "advanced" property has changed.
            if (name.includes("advanced")) {
                return;
            }
            const changeInTopValue = name.includes(".top");
            const advanced = get(newElement, `${valueKey}.${editorMode}.advanced`);
            // Update all values in advanced settings
            if (!advanced && changeInTopValue) {
                // Modify the element directly.
                set(newElement, `${valueKey}.${editorMode}.top`, newValue);
                set(newElement, `${valueKey}.${editorMode}.right`, newValue);
                set(newElement, `${valueKey}.${editorMode}.bottom`, newValue);
                set(newElement, `${valueKey}.${editorMode}.left`, newValue);
                // Also set "all"
                set(newElement, `${valueKey}.${editorMode}.all`, newValue);
            }
        }
    });

    const toggleAdvanced = useCallback(
        event => {
            event.stopPropagation();
            getUpdateValue(`${editorMode}.advanced`)(!advanced);
        },
        [advanced]
    );

    const [top, right, bottom, left] = useMemo(() => {
        return SIDES.map(side => {
            if (advanced) {
                return get(element, valueKey + `.${editorMode}.` + side, DEFAULT_VALUE);
            }
            return get(element, valueKey + `.${editorMode}.` + "all", DEFAULT_VALUE);
        });
    }, [advanced, element, editorMode]);

    return (
        <Accordion
            title={startCase(styleAttribute)}
            defaultValue={defaultAccordionValue}
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
                        value={top}
                        onChange={getUpdateValue(`${editorMode}.top`)}
                        options={options[styleAttribute]}
                    />
                </Top>
                <TopRight />
                <Left>
                    <SpacingPicker
                        value={left}
                        onChange={getUpdateValue(`${editorMode}.left`)}
                        options={options[styleAttribute]}
                        disabled={!advanced}
                    />
                </Left>
                <Center className="align-center">
                    <Typography className={"text mono"} use={"subtitle2"}>
                        {get(element, "data.settings.width.value", "auto")}
                        &nbsp;x&nbsp;
                        {get(element, "data.settings.height.value", "auto")}
                    </Typography>
                </Center>
                <Right>
                    <SpacingPicker
                        value={right}
                        onChange={getUpdateValue(`${editorMode}.right`)}
                        options={options[styleAttribute]}
                        disabled={!advanced}
                    />
                </Right>
                <BottomLeft />
                <Bottom className={"align-center"}>
                    <SpacingPicker
                        value={bottom}
                        onChange={getUpdateValue(`${editorMode}.bottom`)}
                        options={options[styleAttribute]}
                        disabled={!advanced}
                    />
                </Bottom>
                <BottomRight />
            </SpacingGrid>
        </Accordion>
    );
};

export default React.memo(MarginPaddingSettings);
