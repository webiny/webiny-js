import React from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import merge from "lodash/merge";
import set from "lodash/set";
import get from "lodash/get";
import { Form } from "@webiny/form";
import { FormAPI } from "@webiny/form/types";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin,
    PbEditorElement
} from "~/types";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import {
    activeElementAtom,
    elementWithChildrenByIdSelector,
    uiAtom
} from "../../../../editor/recoil/modules";
// Components
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import SpacingPicker from "../components/SpacingPicker";
import { classes } from "../components/StyledComponents";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
import { Validator } from "@webiny/validation/types";

const rightCellStyle = css({
    justifySelf: "end"
});

const spacingPickerStyle = css({
    width: "120px",
    "& .inner-wrapper": {
        display: "flex"
    }
});

const widthUnitOptions = [
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
        label: "vw",
        value: "vw"
    },
    {
        label: "auto",
        value: "auto"
    }
];

enum WidthUnits {
    percentage = "%",
    px = "px",
    em = "em",
    vw = "vw",
    auto = "auto"
}

const validateWidth: Validator = (value: string | undefined) => {
    if (!value) {
        return true;
    }
    const parsedValue = parseInt(value);

    if (isNaN(parsedValue) && value !== WidthUnits.auto) {
        throw Error("Enter a valid number!");
    }

    if (parsedValue < 0) {
        throw Error("Value can't be negative!");
    }

    if (
        value.endsWith(WidthUnits.percentage) ||
        value.endsWith(WidthUnits.px) ||
        value.endsWith(WidthUnits.em) ||
        value.endsWith(WidthUnits.vw) ||
        value.endsWith(WidthUnits.auto)
    ) {
        return true;
    }

    throw Error("Specify a valid value!");
};

const DATA_NAMESPACE = "data.settings.width";

const Settings = ({ defaultAccordionValue }: PbEditorPageElementSettingsRenderComponentProps) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementWithChildrenByIdSelector(activeElementId));

    const handler = useEventActionHandler();
    const updateSettings = async (data: Record<string, any>, form: FormAPI) => {
        const valid = await form.validate();
        if (!valid) {
            return null;
        }

        const newElement: PbEditorElement = merge(
            {},
            element,
            set({}, `${DATA_NAMESPACE}.${displayMode}`, data)
        );

        return handler.trigger(
            new UpdateElementActionEvent({
                element: newElement,
                history: true
            })
        );
    };

    const memoizedResponsiveModePlugin = React.useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const { config: activeDisplayModeConfig } = memoizedResponsiveModePlugin || {
        config: {
            displayMode: null,
            icon: null
        }
    };

    const settings = React.useMemo(() => {
        const fallbackValue = applyFallbackDisplayMode(displayMode, mode =>
            get(element, `${DATA_NAMESPACE}.${mode}`)
        );

        return get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue || { value: "100%" });
    }, [displayMode, element]);

    return (
        <Accordion
            title={"Width"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
            <Form
                data={settings}
                onChange={(data, form) => {
                    if (!form) {
                        return;
                    }
                    return updateSettings(data, form);
                }}
            >
                {({ Bind }) => (
                    <Wrapper
                        label={"Width"}
                        containerClassName={classes.simpleGrid}
                        rightCellClassName={rightCellStyle}
                    >
                        <Bind name={"value"} validators={validateWidth}>
                            {({ value, onChange, validation }) => (
                                <SpacingPicker
                                    value={value}
                                    onChange={onChange}
                                    validation={validation}
                                    options={widthUnitOptions}
                                    className={spacingPickerStyle}
                                    useDefaultStyle={false}
                                />
                            )}
                        </Bind>
                    </Wrapper>
                )}
            </Form>
        </Accordion>
    );
};
export default React.memo(Settings);
