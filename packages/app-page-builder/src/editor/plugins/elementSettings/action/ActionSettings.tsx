import React from "react";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { css } from "emotion";
import { merge } from "dot-prop-immutable";
import { Switch } from "@webiny/ui/Switch";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { withActiveElement } from "../../../components";
import { DelayedOnChange } from "../../../components/DelayedOnChange";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import {
    PbButtonElementClickHandlerPlugin,
    PbEditorElement,
    PbEditorPageElementSettingsRenderComponentProps
} from "../../../../types";
import { plugins } from "@webiny/plugins";

// Components
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
import SelectField from "../components/SelectField";
import InputField from "../components/InputField";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    gridCellClass: css({
        justifySelf: "end"
    })
};

type ActionSettingsPropsType = {
    element: PbEditorElement;
};
const ActionSettingsComponent: React.FunctionComponent<
    ActionSettingsPropsType & PbEditorPageElementSettingsRenderComponentProps
> = ({ element, defaultAccordionValue }) => {
    const handler = useEventActionHandler();

    let href: string, newTab: boolean;

    if (element.data?.link && !element.data?.action) {
        href = element.data?.link.href;
        newTab = element.data?.link.newTab;
    } else {
        href = element.data?.action.href;
        newTab = element.data?.action.newTab;
    }

    const { clickHandler, actionType, parameters } = element.data?.action || {};

    const updateElement = (element: PbEditorElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element,
                history: true
            })
        );
    };

    const updateSettings = data => {
        const attrKey = `data.action`;
        const newElement: PbEditorElement = merge(element, attrKey, data);
        updateElement(newElement);
    };

    return (
        <Accordion title={"Action"} defaultValue={defaultAccordionValue}>
            <Form
                data={{ href, newTab, clickHandler, actionType, parameters }}
                onChange={updateSettings}
            >
                {({ Bind }) => {
                    const actionTypeOptions = [
                        { id: "link", name: "Href Link" },
                        { id: "onClickHandler", name: "Click Handler" }
                    ];
                    const clickHandlers = plugins.byType<PbButtonElementClickHandlerPlugin>(
                        "pb-button-element-click-handler"
                    );

                    return (
                        <>
                            <Wrapper label={"Action Type"} containerClassName={classes.gridClass}>
                                <Bind name="actionType" defaultValue={actionTypeOptions[0].id}>
                                    <RadioGroup label="Select the button's action type">
                                        {({ onChange, getValue }) => (
                                            <React.Fragment>
                                                {actionTypeOptions.map(({ id, name }) => (
                                                    <Radio
                                                        key={id}
                                                        label={name}
                                                        value={getValue(id)}
                                                        onChange={onChange(id)}
                                                    />
                                                ))}
                                            </React.Fragment>
                                        )}
                                    </RadioGroup>
                                </Bind>
                            </Wrapper>
                            {actionType === "onClickHandler" ? (
                                <>
                                    <Wrapper
                                        label={"Click Handler"}
                                        containerClassName={classes.gridClass}
                                    >
                                        <Bind
                                            name={"clickHandler"}
                                            defaultValue={clickHandlers[0].name}
                                        >
                                            {({ value, onChange }) => (
                                                <SelectField
                                                    value={value || clickHandlers[0].name}
                                                    onChange={option => {
                                                        onChange(option);
                                                    }}
                                                >
                                                    {clickHandlers.map(handler => (
                                                        <option
                                                            key={handler.name}
                                                            value={handler.name}
                                                        >
                                                            {handler.title}
                                                        </option>
                                                    ))}
                                                </SelectField>
                                            )}
                                        </Bind>
                                    </Wrapper>
                                    <Wrapper
                                        label={"Parameters"}
                                        containerClassName={classes.gridClass}
                                    >
                                        <Bind name="parameters" defaultValue={[]}>
                                            {({ value, onChange }) => {
                                                const selectedHandler = clickHandlers.find(
                                                    handler => clickHandler === handler.name
                                                );
                                                return (
                                                    <>
                                                        {selectedHandler?.parameters ? (
                                                            selectedHandler.parameters.map(
                                                                (parameter, index) => {
                                                                    return (
                                                                        <InputField
                                                                            key={index}
                                                                            description={
                                                                                parameter.label
                                                                            }
                                                                            value={value[index]}
                                                                            placeholder={
                                                                                parameter.label
                                                                            }
                                                                            onChange={val => {
                                                                                const tempArray = [
                                                                                    ...value
                                                                                ];
                                                                                tempArray[index] =
                                                                                    val;
                                                                                onChange(tempArray);
                                                                            }}
                                                                        />
                                                                    );
                                                                }
                                                            )
                                                        ) : (
                                                            <p>None Required</p>
                                                        )}
                                                    </>
                                                );
                                            }}
                                        </Bind>
                                    </Wrapper>
                                </>
                            ) : (
                                <>
                                    <Wrapper label={"URL"} containerClassName={classes.gridClass}>
                                        <Bind
                                            name={"href"}
                                            validators={validation.create(
                                                "url:allowRelative:allowHref"
                                            )}
                                        >
                                            <DelayedOnChange>
                                                {props => (
                                                    <InputField
                                                        value={props.value || ""}
                                                        onChange={props.onChange}
                                                        placeholder={"https://webiny.com/blog"}
                                                        {...props}
                                                    />
                                                )}
                                            </DelayedOnChange>
                                        </Bind>
                                    </Wrapper>
                                    <Wrapper
                                        label={"New tab"}
                                        containerClassName={classes.gridClass}
                                        rightCellClassName={classes.gridCellClass}
                                    >
                                        <Bind name={"newTab"}>
                                            <Switch />
                                        </Bind>
                                    </Wrapper>
                                </>
                            )}
                        </>
                    );
                }}
            </Form>
        </Accordion>
    );
};

export default withActiveElement()(ActionSettingsComponent);
