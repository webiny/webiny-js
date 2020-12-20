import React from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { Form } from "@webiny/form";
import { PbEditorPageElementSettingsRenderComponentProps } from "../../../../types";
import { useEventActionHandler } from "../../../../editor";
import { UpdateElementActionEvent } from "../../../../editor/recoil/actions";
import { activeElementWithChildrenSelector } from "../../../../editor/recoil/modules";
// Components
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import SpacingPicker from "../components/SpacingPicker";
import { classes } from "../components/StyledComponents";

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

const validateWidth = (value: string | undefined) => {
    if (!value) {
        return null;
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

const Settings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const handler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const updateSettings = async (data, form) => {
        const valid = await form.validate();
        if (!valid) {
            return;
        }

        return handler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: {
                        ...element.data,
                        settings: {
                            ...(element.data.settings || {}),
                            width: data
                        }
                    }
                }
            })
        );
    };

    const settings = element.data.settings?.width || { value: "100%" };

    return (
        <Accordion title={"Width"} defaultValue={defaultAccordionValue}>
            <Form data={settings} onChange={updateSettings}>
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
