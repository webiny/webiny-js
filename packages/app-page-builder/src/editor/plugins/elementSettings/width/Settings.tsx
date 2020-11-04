import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Input } from "@webiny/ui/Input";
import { InputContainer } from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
import { useRecoilValue } from "recoil";

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
        <Form data={settings} onChange={updateSettings}>
            {({ Bind }) => (
                <Tabs>
                    <Tab label={"Width"}>
                        <Grid>
                            <Cell span={5}>
                                <Typography use={"overline"}>Width</Typography>
                            </Cell>
                            <Cell span={7}>
                                <InputContainer width={"auto"} margin={0}>
                                    <Bind name={"value"} validators={validateWidth}>
                                        <Input />
                                    </Bind>
                                </InputContainer>
                            </Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            )}
        </Form>
    );
};
export default React.memo(Settings);
