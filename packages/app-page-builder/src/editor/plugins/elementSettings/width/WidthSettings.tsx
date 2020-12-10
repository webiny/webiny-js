import React from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
// Components
import { InputContainer, ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
import InputField from "../components/InputField";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    icon: css({
        "& .mdc-list-item__graphic > svg": {
            transform: "rotate(90deg)"
        }
    }),
    inputWrapper: css({
        "& .mdc-text-field": {
            width: "100% !important",
            margin: "0px !important"
        }
    })
};

const validateWidth = value => {
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
                            width: data
                        }
                    }
                }
            })
        );
    };

    const settings = element.data.settings?.width || { value: "100%" };

    return (
        <Accordion title={"Width"}>
            <Form data={settings} onChange={updateSettings}>
                {({ Bind }) => (
                    <ContentWrapper>
                        <Grid className={classes.grid}>
                            <Cell span={5}>
                                <Typography use={"subtitle2"}>Width</Typography>
                            </Cell>
                            <Cell span={7}>
                                <InputContainer width={"auto"} margin={0}>
                                    <Bind name={"value"} validators={validateWidth}>
                                        <InputField />
                                    </Bind>
                                </InputContainer>
                            </Cell>
                        </Grid>
                    </ContentWrapper>
                )}
            </Form>
        </Accordion>
    );
};
export default React.memo(Settings);
