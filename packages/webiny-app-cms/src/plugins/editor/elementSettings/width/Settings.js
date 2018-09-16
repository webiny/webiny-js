//@flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { set } from "dot-prop-immutable";

import { Tabs, Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { InputContainer } from "../utils/StyledComponents";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";
import { Form } from "webiny-form";

import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";

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

type Props = {
    element: Object,
    updateElement: Function
};

class Settings extends React.Component<Props> {
    historyUpdated = {};

    updateSettings = async (data, form) => {
        const valid = await form.validate();
        if (!valid) {
            return;
        }

        const { element, updateElement } = this.props;
        const attrKey = `settings.style`;
        const newElement = set(element, attrKey, data);

        updateElement({ element: newElement });
    };

    render() {
        const { element } = this.props;
        const { settings } = element;

        return (
            <Form data={settings.style || { width: "100%" }} onChange={this.updateSettings}>
                {({ Bind }) => (
                    <Tabs>
                        <Tab label={"Width"}>
                            <Grid>
                                <Cell span={5}>
                                    <Typography use={"overline"}>Width</Typography>
                                </Cell>
                                <Cell span={7}>
                                    <InputContainer width={"auto"} margin={0}>
                                        <Bind name={"width"} validators={[validateWidth]}>
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
    }
}

export default compose(
    connect(
        null,
        { updateElement }
    ),
    withActiveElement()
)(Settings);
