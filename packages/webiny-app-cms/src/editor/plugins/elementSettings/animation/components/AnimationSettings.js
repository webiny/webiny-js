//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers, withState } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Grid } from "webiny-ui/Grid";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement, setTmp } from "webiny-app-cms/editor/actions";
import Footer from "./PMFooter";
import Select from "./Select";
import Input from "./Input";
import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

/**
 * PMSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type Props = Object & {
    value: Object | number
};

const Settings = ({ title, advanced, setAdvanced, getAttributeValue, getUpdateValue }: Props) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={title}>
                    <Grid>
                        <Select
                            label={"Select animation"}
                            value={getAttributeValue("data-aos")}
                            updateValue={getUpdateValue("data-aos")}
                        >
                            <option value="">No animation</option>
                            <optgroup label="Fade">
                                <option value="fade">Fade</option>
                                <option value="fade-up">Fade Up</option>
                                <option value="fade-down">Fade Down</option>
                                <option value="fade-left">Fade Left</option>
                                <option value="fade-right">Fade Right</option>
                                <option value="fade-up-right">Fade Up Right</option>
                                <option value="fade-up-left">Fade Up Left</option>
                                <option value="fade-down-right">Fade Down Right</option>
                                <option value="fade-down-left">Fade Down Left</option>
                            </optgroup>
                            <optgroup label="Flip">
                                <option value="flip-up">Flip Up</option>
                                <option value="flip-down">Flip Down</option>
                                <option value="flip-left">Flip Left</option>
                                <option value="flip-right">Flip Right</option>
                            </optgroup>
                            <optgroup label="Slide">
                                <option value="slide-up">Slide Up</option>
                                <option value="slide-down">Slide Down</option>
                                <option value="slide-left">Slide Left</option>
                                <option value="slide-right">Slide Right</option>
                            </optgroup>
                        </Select>
                    </Grid>

                    {advanced && (
                        <>
                            <Grid className={"no-bottom-padding"}>
                                <Input
                                    label={"Duration (ms)"}
                                    value={getAttributeValue("data-aos-duration")}
                                    updateValue={getUpdateValue("data-aos-duration")}
                                />
                            </Grid>
                            <Grid className={"no-bottom-padding"}>
                                <Input
                                    label={"Delay (ms)"}
                                    value={getAttributeValue("data-aos-delay")}
                                    updateValue={getUpdateValue("data-aos-delay")}
                                />
                            </Grid>
                        </>
                    )}
                    <Footer advanced={advanced} toggleAdvanced={setAdvanced} />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

const ConnectedSettings = compose(
    withActiveElement({ shallow: true }),
    connect(
        null,
        { updateElement, setTmp }
    ),
    withHandlers({
        updateSettings: ({ element, updateElement, animation: { refresh } }: Object) => {
            return (name: string, newValue: mixed, history = false) => {
                let newElement = { ...element };
                const attributes = { ...element.settings.attributes };
                attributes[name] = newValue;

                updateElement({
                    element: set(newElement, "settings.attributes", attributes),
                    history
                });

                refresh();
            };
        }
    }),
    withHandlers({
        getUpdateValue: ({ updateSettings }: Object) => {
            const handlers = {};
            return (name: string) => {
                if (!handlers[name]) {
                    return value => updateSettings(name, value, true);
                }

                return handlers[name];
            };
        },
        getValue: ({ element }: Object) => {
            return name => get(element, `settings.attributes.${name}`) || "";
        }
    }),
    withHandlers({
        getAttributeValue: ({ element }: Object) => {
            return name => get(element, `settings.attributes.${name}`) || "";
        }
    }),
    withState("advanced", "setAdvanced", false)
)(Settings);

export default function AnimationSettings(props: *) {
    return (
        <ElementAnimation>
            {animation => {
                return <ConnectedSettings {...props} animation={animation} />;
            }}
        </ElementAnimation>
    );
}
