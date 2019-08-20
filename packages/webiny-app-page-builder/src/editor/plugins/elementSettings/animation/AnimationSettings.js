//@flow
import React from "react";
import { connect } from "webiny-app-page-builder/editor/redux";
import { compose } from "recompose";
import { get, isEqual } from "lodash";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { getActiveElement } from "webiny-app-page-builder/editor/selectors";
import withUpdateHandlers from "../components/withUpdateHandlers";
import Footer from "../components/Footer";
import Select from "../components/Select";
import Input from "../components/Input";
import DurationInput from "../components/SliderWithInput";
import { ReactComponent as TimerIcon } from "./icons/round-av_timer-24px.svg";

import ElementAnimation from "webiny-app-page-builder/render/components/ElementAnimation";

type Props = Object & {
    value: Object | number
};

const DATA_NAMESPACE = "data.settings.animation";

const Settings = ({ title, advanced, getUpdateValue, getUpdatePreview }: Props) => {
    return (
        <React.Fragment>
            <Tabs>
                <Tab label={title}>
                    <Select
                        label={"Animation"}
                        valueKey={DATA_NAMESPACE + ".name"}
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

                    {advanced && (
                        <>
                            <DurationInput
                                className={"no-bottom-padding"}
                                label={"Duration"}
                                icon={<TimerIcon />}
                                valueKey={DATA_NAMESPACE + ".duration"}
                                updateValue={getUpdateValue("duration")}
                                updatePreview={getUpdatePreview("duration")}
                            />
                            <Input
                                className={"no-bottom-padding"}
                                placeholder={"ms"}
                                label={"Delay"}
                                valueKey={DATA_NAMESPACE + ".delay"}
                                updateValue={getUpdateValue("delay")}
                            />

                            <Input
                                className={"no-bottom-padding"}
                                placeholder={"px"}
                                label={"offset"}
                                valueKey={DATA_NAMESPACE + ".offset"}
                                updateValue={getUpdateValue("offset")}
                            />

                            <Select
                                label={"Easing"}
                                valueKey={DATA_NAMESPACE + ".easing"}
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
                        </>
                    )}
                    <Footer advanced={advanced} toggleAdvanced={getUpdateValue("advanced")} />
                </Tab>
            </Tabs>
        </React.Fragment>
    );
};

const ConnectedSettings = compose(
    connect(
        state => {
            const element = getActiveElement(state);
            return {
                advanced: get(element, DATA_NAMESPACE + ".advanced", false),
                element: { id: element.id, type: element.type, path: element.path }
            };
        },
        null,
        null,
        { areStatePropsEqual: isEqual }
    ),
    withUpdateHandlers({ namespace: DATA_NAMESPACE })
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
