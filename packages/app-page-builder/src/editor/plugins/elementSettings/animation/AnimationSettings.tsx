import React, { useEffect } from "react";
import { css } from "emotion";
import get from "lodash/get";
import { Cell, Grid } from "@webiny/ui/Grid";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
import ElementAnimation from "~/render/components/ElementAnimation";
import useUpdateHandlers from "../useUpdateHandlers";
// Components
import DurationInput from "../components/SliderWithInput";
import SelectField from "../components/SelectField";
import { ContentWrapper } from "../components/StyledComponents";
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";
// Icon
import { ReactComponent as TimerIcon } from "./icons/round-av_timer-24px.svg";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    animationTypeSelectWrapper: css({}),
    inputWrapper: css({
        "& .mdc-text-field": {
            width: "100% !important",
            margin: "0px !important"
        }
    })
};

/**
 * Duration and delay accept values from 50 to 3000, with step 50ms.
 * https://github.com/michalsnik/aos#setting-duration-delay
 */
const STEP = 50;
const MAX_VALUE = 3000;
const DATA_NAMESPACE = "data.settings.animation";
type SettingsPropsType = {
    animation: any;
};
const Settings: React.FC<SettingsPropsType & PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const [element] = useActiveElement<PbEditorElement>();

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });
    const animationName = get(element, DATA_NAMESPACE + ".name", "");
    const animationDuration = get(element, DATA_NAMESPACE + ".duration", 0);
    // Trigger animation manually on "animation" type change.
    useEffect(() => {
        if (animationName) {
            const animationElement = document.querySelector(`[data-aos=${animationName}]`);
            if (animationElement) {
                animationElement.classList.remove("aos-animate");
                setTimeout(
                    () => animationElement.classList.add("aos-animate"),
                    animationDuration || 250
                );
            }
        }
    }, [animationName, animationDuration]);

    return (
        <Accordion title={"Animation"} defaultValue={defaultAccordionValue}>
            <ContentWrapper direction={"column"}>
                <Grid className={classes.grid}>
                    <Cell span={12}>
                        <Wrapper label={"Animation"}>
                            <SelectField
                                value={get(element, DATA_NAMESPACE + ".name", "")}
                                onChange={getUpdateValue("name")}
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
                            </SelectField>
                        </Wrapper>
                    </Cell>
                    <Cell span={12}>
                        <DurationInput
                            className={"no-bottom-padding"}
                            label={"Duration"}
                            icon={<TimerIcon />}
                            valueKey={DATA_NAMESPACE + ".duration"}
                            updateValue={getUpdateValue("duration")}
                            updatePreview={getUpdatePreview("duration")}
                            max={MAX_VALUE}
                            step={STEP}
                        />
                    </Cell>
                    <Cell span={12}>
                        <Wrapper label={"Delay"}>
                            <InputField
                                placeholder={"ms"}
                                value={get(element, DATA_NAMESPACE + ".delay", 0)}
                                onChange={getUpdateValue("delay")}
                                min={0}
                                max={MAX_VALUE}
                                step={STEP}
                            />
                        </Wrapper>
                    </Cell>
                    <Cell span={12}>
                        <Wrapper label={"Offset"}>
                            <InputField
                                placeholder={"px"}
                                value={get(element, DATA_NAMESPACE + ".offset", 0)}
                                onChange={getUpdateValue("offset")}
                            />
                        </Wrapper>
                    </Cell>
                    <Cell span={12}>
                        <Wrapper label={"Easing"}>
                            <SelectField
                                value={get(element, DATA_NAMESPACE + ".easing", "")}
                                onChange={getUpdateValue("easing")}
                            >
                                <option value="">Default</option>
                                <option value="linear">Linear</option>
                                <option value="ease">Ase</option>
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
                            </SelectField>
                        </Wrapper>
                    </Cell>
                </Grid>
            </ContentWrapper>
        </Accordion>
    );
};
type AnimationSettingsPropsType = {
    title?: string;
    styleAttribute?: string;
};
const AnimationSettings: React.FC<
    AnimationSettingsPropsType & PbEditorPageElementSettingsRenderComponentProps
> = props => {
    return (
        <ElementAnimation>
            {animation => {
                return <Settings {...props} animation={animation} />;
            }}
        </ElementAnimation>
    );
};
export default AnimationSettings;
