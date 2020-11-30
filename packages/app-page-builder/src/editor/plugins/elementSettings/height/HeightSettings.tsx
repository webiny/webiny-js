import React from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { Input } from "@webiny/ui/Input";
import { AccordionItem } from "@webiny/ui/Accordion";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { Form } from "@webiny/form";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Components
import { InputContainer, ContentWrapper } from "../components/StyledComponents";
// Icons
import { ReactComponent as HeightIcon } from "../../../assets/icons/height-black.svg";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

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
        <AccordionItem icon={<HeightIcon />} title={"Height"} description={"Edit element height."}>
            <Form data={data} onChange={updateSettings}>
                {({ Bind, data }) => (
                    <ContentWrapper direction={"column"}>
                        <Grid className={classes.grid}>
                            <Cell span={5}>
                                <Typography use={"overline"}>full height</Typography>
                            </Cell>
                            <Cell span={7}>
                                <InputContainer width={"auto"} margin={0}>
                                    <Bind name={"fullHeight"}>
                                        <Switch />
                                    </Bind>
                                </InputContainer>
                            </Cell>
                        </Grid>
                        {!data.fullHeight && (
                            <Grid className={classes.grid}>
                                <Cell span={5}>
                                    <Typography use={"overline"}>height</Typography>
                                </Cell>
                                <Cell span={7}>
                                    <InputContainer width={"auto"} margin={0}>
                                        <Bind name={"value"} validators={validateHeight}>
                                            <Input />
                                        </Bind>
                                    </InputContainer>
                                </Cell>
                            </Grid>
                        )}
                    </ContentWrapper>
                )}
            </Form>
        </AccordionItem>
    );
};

export default React.memo(Settings);
