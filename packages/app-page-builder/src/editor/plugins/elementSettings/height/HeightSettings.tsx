import React from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { Switch } from "@webiny/ui/Switch";
import { Form } from "@webiny/form";
import { PbEditorPageElementSettingsRenderComponentProps } from "../../../../types";
import { useEventActionHandler } from "../../../../editor";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementWithChildrenSelector } from "../../../recoil/modules";
// Components
import { classes } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import SpacingPicker from "../components/SpacingPicker";

const rightCellStyle = css({
    justifySelf: "end"
});

const spacingPickerStyle = css({
    width: "120px",
    "& .inner-wrapper": {
        display: "flex"
    }
});

const heightUnitOptions = [
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
        label: "auto",
        value: "auto"
    }
];

enum HeightUnits {
    percentage = "%",
    px = "px",
    em = "em",
    vh = "vh",
    auto = "auto"
}

const validateHeight = (value: string | undefined) => {
    if (!value) {
        return null;
    }
    const parsedValue = parseInt(value);

    if (isNaN(parsedValue) && value !== HeightUnits.auto) {
        throw Error("Enter a valid number!");
    }

    if (parsedValue < 0) {
        throw Error("Height can't be negative!");
    }

    if (
        value.endsWith(HeightUnits.percentage) ||
        value.endsWith(HeightUnits.px) ||
        value.endsWith(HeightUnits.em) ||
        value.endsWith(HeightUnits.vh) ||
        value.endsWith(HeightUnits.auto)
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
                            height: data
                        }
                    }
                }
            })
        );
    };

    const data = element.data.settings?.height || { fullHeight: false, value: "100%" };

    return (
        <Accordion title={"Height"} defaultValue={defaultAccordionValue}>
            <Form data={data} onChange={updateSettings}>
                {({ Bind, data }) => (
                    <>
                        <Wrapper
                            label={"Full height"}
                            containerClassName={classes.simpleGrid}
                            rightCellClassName={rightCellStyle}
                        >
                            <Bind name={"fullHeight"}>
                                <Switch />
                            </Bind>
                        </Wrapper>
                        {!data.fullHeight && (
                            <Wrapper
                                label={"Height"}
                                containerClassName={classes.simpleGrid}
                                rightCellClassName={rightCellStyle}
                            >
                                <Bind name={"value"} validators={validateHeight}>
                                    {({ value, onChange, validation }) => (
                                        <SpacingPicker
                                            value={value}
                                            onChange={onChange}
                                            validation={validation}
                                            options={heightUnitOptions}
                                            className={spacingPickerStyle}
                                            useDefaultStyle={false}
                                        />
                                    )}
                                </Bind>
                            </Wrapper>
                        )}
                    </>
                )}
            </Form>
        </Accordion>
    );
};

export default React.memo(Settings);
