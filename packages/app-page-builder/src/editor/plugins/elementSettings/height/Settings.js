import React from "react";
import { get } from "lodash";
import { set } from "dot-prop-immutable";

import { connect } from "@webiny/app-page-builder/editor/redux";
import { useHandler } from "@webiny/app/hooks/useHandler";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Input } from "@webiny/ui/Input";
import { InputContainer } from "@webiny/app-page-builder/editor/plugins/elementSettings/components/StyledComponents";
import { Typography } from "@webiny/ui/Typography";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Switch } from "@webiny/ui/Switch";
import { Form } from "@webiny/form";

import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";

const validateHeight = value => {
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

const Settings = props => {
    const updateSettings = useHandler(props, ({ element, updateElement }) => async (data, form) => {
        const valid = await form.validate();
        if (!valid) {
            return;
        }

        const attrKey = `data.settings.height`;
        const newElement = set(element, attrKey, data);

        updateElement({ element: newElement });
    });

    const data = get(props.element.data, "settings.height", { fullHeight: false, value: "100%" });

    return (
        <Form data={data} onChange={updateSettings}>
            {({ Bind, data }) => (
                <Tabs>
                    <Tab label={"height"}>
                        <Grid>
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
                            <Grid>
                                <Cell span={5}>
                                    <Typography use={"overline"}>height</Typography>
                                </Cell>
                                <Cell span={7}>
                                    <InputContainer width={"auto"} margin={0}>
                                        <Bind name={"value"} validators={[validateHeight]}>
                                            <Input />
                                        </Bind>
                                    </InputContainer>
                                </Cell>
                            </Grid>
                        )}
                    </Tab>
                </Tabs>
            )}
        </Form>
    );
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(Settings);
