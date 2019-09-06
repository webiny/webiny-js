//@flow
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
import { Form } from "@webiny/form";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";

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

const Settings = props => {
    const updateSettings = useHandler(props, ({ element, updateElement }) => async (data, form) => {
        const valid = await form.validate();
        if (!valid) {
            return;
        }

        const attrKey = `data.settings.width`;
        const newElement = set(element, attrKey, data);

        updateElement({ element: newElement });
    });

    const { data } = props.element;

    const settings = get(data, "settings.width", { value: "100%" });

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
                                    <Bind name={"value"} validators={[validateWidth]}>
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

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(Settings);
