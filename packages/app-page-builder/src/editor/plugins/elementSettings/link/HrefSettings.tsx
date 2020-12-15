import React from "react";
import { css } from "emotion";
import { merge } from "dot-prop-immutable";
import { Switch } from "@webiny/ui/Switch";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { DelayedOnChange } from "@webiny/app-page-builder/editor/components/DelayedOnChange";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbElement
} from "@webiny/app-page-builder/types";
// Components
import Accordion from "../components/Accordion";
import Wrapper from "../components/Wrapper";
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

type LinkSettingsPropsType = {
    element: PbElement;
};
const LinkSettingsComponent: React.FunctionComponent<LinkSettingsPropsType &
    PbEditorPageElementSettingsRenderComponentProps> = ({ element, defaultAccordionValue }) => {
    const handler = useEventActionHandler();

    const { href, newTab } = element.data?.link || {};

    const updateElement = (element: PbElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element
            })
        );
    };

    const updateSettings = data => {
        const attrKey = `data.link`;
        const newElement: PbElement = merge(element, attrKey, data);
        updateElement(newElement);
    };

    return (
        <Accordion title={"Link"} defaultValue={defaultAccordionValue}>
            <Form data={{ href, newTab }} onChange={updateSettings}>
                {({ Bind }) => (
                    <>
                        <Wrapper label={"URL"} containerClassName={classes.gridClass}>
                            <Bind
                                name={"href"}
                                validators={validation.create("url:allowRelative:allowHref")}
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
            </Form>
        </Accordion>
    );
};

export default withActiveElement()(LinkSettingsComponent);
