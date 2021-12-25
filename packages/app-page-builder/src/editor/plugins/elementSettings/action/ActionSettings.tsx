import React, { useMemo } from "react";
import { Radio, RadioGroup } from "@webiny/ui/Radio";
import { css } from "emotion";
import { merge } from "dot-prop-immutable";
import { Switch } from "@webiny/ui/Switch";
import { Typography } from "@webiny/ui/Typography";
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
import InputField from "../components/InputField";
import SelectField from "../components/SelectField";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    }),
    gridCellClass: css({
        justifySelf: "end"
    }),
    bottomMargin: css({
        marginBottom: 8
    })
};

type ActionSettingsPropsType = {
    element: PbEditorElement;
};
const ActionSettingsComponent: React.FunctionComponent<
    ActionSettingsPropsType & PbEditorPageElementSettingsRenderComponentProps
> = ({ element, defaultAccordionValue }) => {
    const handler = useEventActionHandler();

    // Let's preserve backwards compatibility by extracting href and newTab properties from deprecated
    //  "link" element object if it exists, otherwise we'll use the newer "action" element object
    let href: string, newTab: boolean;

    if (element.data?.link && !element.data?.action) {
        href = element.data?.link?.href;
        newTab = element.data?.link?.newTab;
    } else {
        href = element.data?.action?.href;
        newTab = element.data?.action?.newTab;
    }

    const { clickHandler, actionType, variables } = element.data?.action || {};

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

    const clickHandlers = useMemo(
        () =>
            plugins.byType<PbButtonElementClickHandlerPlugin>(
                "pb-page-element-button-click-handler"
            ),
        []
    );
    const selectedHandler = useMemo(() => {
        return clickHandlers.find(handler => clickHandler === handler.name);
    }, [clickHandler]);

    return (
        <Accordion title={"Action"} defaultValue={defaultAccordionValue}>
            <Form
                data={{ href, newTab, clickHandler, actionType, variables }}
                onChange={updateSettings}
            >
                {({ Bind }) => {
                    const actionTypeOptions = [
                        { id: "link", name: "Link" },
                        { id: "onClickHandler", name: "Click Handler" }
                    ];

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
                                    <Bind name={"clickHandler"}>
                                        {({ value, onChange }) => (
                                            <Wrapper
                                                label={"Handler"}
                                                containerClassName={classes.gridClass}
                                            >
                                                <SelectField
                                                    value={value}
                                                    onChange={onChange}
                                                    placeholder={"No handlers found."}
                                                >
                                                    {clickHandlers.map(item => (
                                                        <option key={item.name} value={item.name}>
                                                            {item.title}
                                                        </option>
                                                    ))}
                                                </SelectField>
                                            </Wrapper>
                                        )}
                                    </Bind>

                                    <Wrapper
                                        label={"Variables"}
                                        containerClassName={classes.gridClass}
                                    >
                                        <Bind name="variables" defaultValue={{}}>
                                            <DelayedOnChange>
                                                {({ value, onChange }) => {
                                                    if (!selectedHandler?.variables) {
                                                        return (
                                                            <Typography use="body2">
                                                                None required.
                                                            </Typography>
                                                        );
                                                    }

                                                    return (
                                                        <>
                                                            {selectedHandler.variables.map(
                                                                (variable, index) => (
                                                                    <InputField
                                                                        key={index}
                                                                        value={value[variable.name]}
                                                                        placeholder={variable.label}
                                                                        className={
                                                                            classes.bottomMargin
                                                                        }
                                                                        onChange={val =>
                                                                            onChange({
                                                                                ...value,
                                                                                [variable.name]: val
                                                                            })
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </>
                                                    );
                                                }}
                                            </DelayedOnChange>
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
