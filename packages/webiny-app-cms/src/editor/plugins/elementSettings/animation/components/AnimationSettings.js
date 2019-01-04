//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose, withHandlers } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Grid } from "webiny-ui/Grid";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import Footer from "./PMFooter";
import Select from "./Select";
import Input from "./Input";
import DurationInput from "./DurationInput";
import { ReactComponent as TimerIcon } from "./icons/round-av_timer-24px.svg";

import ElementAnimation from "webiny-app-cms/render/components/ElementAnimation";

/**
 * PMSettings (Padding/Margin settings).
 * This component is reused in Padding and Margin plugins since the behavior of both CSS attributes is the same.
 */

type Props = Object & {
    value: Object | number
};

const Settings = ({ title, getValue, getUpdateValue, getUpdatePreview }: Props) => {
    const advanced = getValue("advanced");

    return (
        <React.Fragment>
            <Tabs>
                <Tab label={title}>
                    <Grid>
                        <Select
                            label={"Animation"}
                            value={getValue("name")}
                            updateValue={getUpdateValue("name")}
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
                                <DurationInput
                                    label={"Duration"}
                                    icon={<TimerIcon />}
                                    value={getValue("duration")}
                                    updateValue={getUpdateValue("duration")}
                                    updatePreview={getUpdatePreview("duration")}
                                />
                            </Grid>
                            <Grid className={"no-bottom-padding"}>
                                <Input
                                    placeholder={"ms"}
                                    label={"Delay"}
                                    value={getValue("delay")}
                                    updateValue={getUpdateValue("delay")}
                                />
                            </Grid>

                            <Grid className={"no-bottom-padding"}>
                                <Input
                                    placeholder={"px"}
                                    label={"offset"}
                                    value={getValue("offset")}
                                    updateValue={getUpdateValue("offset")}
                                />
                            </Grid>

                            <Grid>
                                <Select
                                    label={"Easing"}
                                    value={getValue("easing")}
                                    updateValue={getUpdateValue("easing")}
                                >
                                    <option value="">Default</option>
                                    <option value="linear">Linear </option>
                                    <option value="ease">Ase </option>
                                    <option value="ease-in">Ase in</option>
                                    <option value="ease-out">Out</option>
                                    <option value="ease-in-out">In out</option>
                                    <option value="ease-in-back">In back</option>
                                    <option value="ease-out-back">Out back</option>
                                    <option value="ease-in-out-back">In out-back</option>
                                    <option value="ease-in-sine">In sine</option>
                                    <option value="ease-out-sine">Out sine</option>
                                    <option value="ease-in-out-sine">In out-sine</option>
                                    <option value="ease-in-quad">In quad</option>
                                    <option value="ease-out-quad">Out quad</option>
                                    <option value="ease-in-out-quad">In out-quad</option>
                                    <option value="ease-in-cubic">In cubic</option>
                                    <option value="ease-out-cubic">Out cubic</option>
                                    <option value="ease-in-out-cubic">In out-cubic</option>
                                    <option value="ease-in-quart">In quart</option>
                                    <option value="ease-out-quart">Out quart</option>
                                    <option value="ease-in-out-quart">In out-quart</option>
                                </Select>
                            </Grid>
                        </>
                    )}
                    <Footer advanced={advanced} toggleAdvanced={getUpdateValue("advanced")} />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

const ConnectedSettings = compose(
    withActiveElement({ shallow: true }),
    connect(
        null,
        { updateElement }
    ),
    withHandlers({
        updateSettings: ({ element, updateElement, animation }: Object) => {
            let historyUpdated = false;

            return (name: string, newValue: mixed, history = false) => {
                const attrName = `data.settings.animation.${name}`;

                const newElement = set(element, attrName, newValue);

                if (!history) {
                    updateElement({
                        element: newElement,
                        history
                    });
                } else {
                    if (historyUpdated !== newValue) {
                        historyUpdated = newValue;
                        updateElement({
                            element: newElement,
                            history: true
                        });
                    }
                }

                animation.refresh();
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
        getUpdatePreview: ({ updateSettings }: Object) => {
            const handlers = {};

            return (name: string) => {
                if (!handlers[name]) {
                    return value => updateSettings(name, value, false);
                }

                return handlers[name];
            };
        },
        getValue: ({ element }: Object) => {
            return name => get(element, `data.settings.animation.${name}`) || "";
        }
    })
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
