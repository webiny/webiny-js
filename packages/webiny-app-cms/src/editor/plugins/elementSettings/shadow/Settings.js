//@flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";
import { InputContainer } from "../utils/StyledComponents";
import { Cell, Grid } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";

const attrKey = `settings.style.boxShadow`;

class Settings extends React.Component<*> {
    historyUpdated = null;

    updateSettings = (name, value, history = true) => {
        const { element, updateElement } = this.props;
        const shadow = this.getShadowObject();
        shadow[name] = value === "" ? 0 : value;
        const shadowValue = this.getShadowCss(shadow);

        const newElement = set(element, attrKey, shadowValue);

        if (!history) {
            updateElement({ element: newElement, history });
            return;
        }

        if (this.historyUpdated !== shadowValue) {
            this.historyUpdated = shadowValue;
            updateElement({ element: newElement });
        }
    };

    getShadowObject = () => {
        // box-shadow: none|h-offset v-offset blur spread color |inset|initial|inherit;
        const value = this.getValue();
        const arr = value.split(" ");
        const boxShadow = arr.splice(0, 4);
        boxShadow.push(arr.join(" "));

        return {
            horizontal: parseInt(boxShadow[0]) || 0,
            vertical: parseInt(boxShadow[1]) || 0,
            blur: parseInt(boxShadow[2]) || 0,
            spread: parseInt(boxShadow[3]) || 0,
            color: boxShadow[4] || "#000"
        };
    };

    getShadowCss = values => {
        return [
            values.horizontal + "px",
            values.vertical + "px",
            values.blur + "px",
            values.spread + "px",
            values.color
        ].join(" ");
    };

    getValue = () => {
        return get(this.props.element, "settings.style.boxShadow") || "";
    };

    render() {
        const shadow = this.getShadowObject();

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Shadow"}>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Color</Typography>
                            </Cell>
                            <Cell span={8}>
                                <ColorPicker
                                    compact
                                    value={shadow.color}
                                    onChange={value => this.updateSettings("color", value, false)}
                                    onChangeComplete={value => this.updateSettings("color", value)}
                                />
                            </Cell>

                            <Cell span={4}>
                                <Typography use={"overline"}>Horizontal offset</Typography>
                            </Cell>
                            <Cell span={8}>
                                <InputContainer>
                                    <Input
                                        value={shadow.horizontal}
                                        onChange={value => this.updateSettings("horizontal", value)}
                                    />
                                </InputContainer>
                            </Cell>

                            <Cell span={4}>
                                <Typography use={"overline"}>Vertical offset</Typography>
                            </Cell>
                            <Cell span={8}>
                                <InputContainer>
                                    <Input
                                        value={shadow.vertical}
                                        onChange={value => this.updateSettings("vertical", value)}
                                    />
                                </InputContainer>
                            </Cell>

                            <Cell span={4}>
                                <Typography use={"overline"}>Blur</Typography>
                            </Cell>
                            <Cell span={8}>
                                <InputContainer>
                                    <Input
                                        value={shadow.blur}
                                        onChange={value => this.updateSettings("blur", value)}
                                    />
                                </InputContainer>
                            </Cell>

                            <Cell span={4}>
                                <Typography use={"overline"}>Spread</Typography>
                            </Cell>
                            <Cell span={8}>
                                <InputContainer>
                                    <Input
                                        value={shadow.spread}
                                        onChange={value => this.updateSettings("spread", value)}
                                    />
                                </InputContainer>
                            </Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            </React.Fragment>
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
