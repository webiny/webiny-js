import React from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { Switch } from "@webiny/ui/Switch";
import { Form } from "@webiny/form";
import { useEventActionHandler } from "../../../../editor";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementWithChildrenSelector } from "../../../recoil/modules";
// Components
import { classes } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";

const rightCellStyle = css({
    justifySelf: "end"
});

const validateHeight = (value: string | undefined) => {
    if (!value) {
        return null;
    }

    if (isNaN(parseInt(value))) {
        throw Error("Enter a valid number!");
    }

    if (value.endsWith("%") || value.endsWith("px")) {
        return true;
    }

    throw Error("Specify % or px!");
};

const Settings: React.FunctionComponent = () => {
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
        <Accordion title={"Height"}>
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
                            <Wrapper label={"Height"} containerClassName={classes.simpleGrid}>
                                <Bind name={"value"} validators={validateHeight}>
                                    <InputField />
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
