//@flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Input } from "webiny-ui/Input";
import { Icon } from "webiny-ui/Icon";
import { Slider } from "webiny-ui/Slider";
import { Switch } from "webiny-ui/Switch";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement, setTmp } from "webiny-app-cms/editor/actions";
import { getTmp } from "webiny-app-cms/editor/selectors";
import { ReactComponent as BorderOuterIcon } from "webiny-app-cms/editor/assets/icons/border_outer.svg";
import { ReactComponent as BorderLeftIcon } from "webiny-app-cms/editor/assets/icons/border_left.svg";
import { ReactComponent as BorderRightIcon } from "webiny-app-cms/editor/assets/icons/border_right.svg";
import { ReactComponent as BorderTopIcon } from "webiny-app-cms/editor/assets/icons/border_top.svg";
import { ReactComponent as BorderBottomIcon } from "webiny-app-cms/editor/assets/icons/border_bottom.svg";
import { Footer, InputContainer } from "../utils/StyledComponents";
import { Cell, Grid } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";

/**
 * PMSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */
class PMSettings extends React.Component {
    valueKey = "settings.style." + this.props.styleAttribute;
    historyUpdated = false;

    updateSettings = (name, newValue, history = false) => {
        // Make sure value is an integer
        newValue = parseInt(newValue) || 0;
        // Get current value as object
        let { value } = this.getValueObject();

        const { element, updateElement } = this.props;
        let newElement = { ...element };

        if (name !== "value") {
            value[name] = newValue;
        } else {
            value = newValue;
        }

        newValue = this.getValueCss(value);
        if (!history) {
            updateElement({ element: set(newElement, this.valueKey, newValue), history });
            return;
        }

        if (this.historyUpdated !== newValue) {
            this.historyUpdated = newValue;
            updateElement({ element: set(newElement, this.valueKey, newValue), history: true });
        }
    };

    getValueCss = value => {
        if (typeof value === "number") {
            return value + "px";
        }

        return [value.top, value.right, value.bottom, value.left].join("px ") + "px";
    };

    toggleAdvanced = toggle => {
        const { element, updateElement, setTmp, tmpValue } = this.props;
        const { value } = this.getValueObject();

        if (toggle) {
            updateElement({
                element: set(
                    element,
                    this.valueKey,
                    this.getValueCss(
                        tmpValue || {
                            top: value,
                            right: value,
                            bottom: value,
                            left: value
                        }
                    )
                )
            });
        } else {
            updateElement({
                element: set(element, this.valueKey, this.getValueCss(tmpValue || 0))
            });
        }
        setTmp({ key: `settings.${element.id}.${this.props.styleAttribute}`, value });
    };

    getValueObject = () => {
        const { element } = this.props;
        const padding = get(element, this.valueKey) || "";
        const values = padding.split(" ");
        const advanced = values.length > 1;

        return {
            advanced,
            value: advanced
                ? {
                      top: parseInt(values[0]) || 0,
                      right: parseInt(values[1]) || 0,
                      bottom: parseInt(values[2]) || 0,
                      left: parseInt(values[3]) || 0
                  }
                : parseInt(values[0]) || 0
        };
    };

    renderList = () => {
        const { value, advanced } = this.getValueObject();

        const attrs = advanced
            ? [
                  {
                      name: "top",
                      icon: <BorderTopIcon />,
                      value: value.top
                  },
                  {
                      name: "right",
                      icon: <BorderRightIcon />,
                      value: value.right
                  },
                  {
                      name: "bottom",
                      icon: <BorderBottomIcon />,
                      value: value.bottom
                  },
                  {
                      name: "left",
                      icon: <BorderLeftIcon />,
                      value: value.left
                  }
              ]
            : [
                  {
                      name: "value",
                      icon: <BorderOuterIcon />,
                      value
                  }
              ];

        return (
            <Grid className={"no-bottom-padding"}>
                {attrs.map(attr => (
                    <React.Fragment key={attr.name}>
                        <Cell span={2}>
                            <Icon icon={attr.icon} />
                        </Cell>
                        <Cell span={6}>
                            <Slider
                                value={attr.value}
                                onChange={value => this.updateSettings(attr.name, value, true)}
                                onInput={value => this.updateSettings(attr.name, value)}
                                step={1}
                            />
                        </Cell>
                        <Cell span={4}>
                            <InputContainer>
                                <Input
                                    placeholder={"px"}
                                    value={attr.value}
                                    onChange={value => this.updateSettings(attr.name, value)}
                                />
                            </InputContainer>
                        </Cell>
                    </React.Fragment>
                ))}
            </Grid>
        );
    };

    render() {
        const { advanced } = this.getValueObject();

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={this.props.title}>
                        {this.renderList()}
                        <Footer>
                            <Grid className={"no-bottom-padding"}>
                                <Cell span={8}>
                                    <Typography use={"subtitle2"}>Show advanced options</Typography>
                                </Cell>
                                <Cell span={4}>
                                    <Switch value={advanced} onChange={this.toggleAdvanced} />
                                </Cell>
                            </Grid>
                        </Footer>
                    </Tab>
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    withActiveElement({ omit: ["elements"] }),
    connect(
        (state, props) => ({
            tmpValue: getTmp(state, `settings.${props.element.id}.${props.styleAttribute}`)
        }),
        { updateElement, setTmp }
    )
)(PMSettings);
