import React from "react";
import { css } from "emotion";
import { merge } from "dot-prop-immutable";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { withActiveElement } from "~/editor/components";
import { DelayedOnChange } from "~/editor/components/DelayedOnChange";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { PbEditorPageElementSettingsRenderComponentProps, PbEditorElement } from "~/types";
// Components
import Accordion from "../../../elementSettings/components/Accordion";
import Wrapper from "../../../elementSettings/components/Wrapper";
import InputField from "../../../elementSettings/components/InputField";

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
interface LinkSettingsFormData {
    url?: string;
}

interface LinkSettingsPropsType {
    element: PbEditorElement;
}
const LinkSettingsComponent: React.FC<
    LinkSettingsPropsType & PbEditorPageElementSettingsRenderComponentProps
> = ({ element, defaultAccordionValue }) => {
    const handler = useEventActionHandler();

    const { url } = element.data?.["iframe"] || {};

    const updateElement = (element: PbEditorElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element,
                history: true
            })
        );
    };

    const updateSettings = (data: LinkSettingsFormData) => {
        // Skip update if nothing is changed.
        if (data.url === url) {
            return;
        }

        const isValidUrl = data.url && validation.validateSync(data.url, "url:allowHref");

        if (!isValidUrl) {
            return;
        }

        const attrKey = `data.iframe`;
        const newElement: PbEditorElement = merge(element, attrKey, data);
        updateElement(newElement);
    };

    return (
        <Accordion title={"Source"} defaultValue={defaultAccordionValue}>
            <Form data={{ url }} onChange={updateSettings}>
                {({ Bind }) => (
                    <>
                        <Wrapper label={"URL"} containerClassName={classes.gridClass}>
                            <Bind name={"url"} validators={validation.create("url:allowHref")}>
                                <DelayedOnChange>
                                    {props => (
                                        <InputField
                                            {...props}
                                            value={props.value || ""}
                                            onChange={props.onChange}
                                            placeholder={"https://iframe.source/goes/here"}
                                        />
                                    )}
                                </DelayedOnChange>
                            </Bind>
                        </Wrapper>
                    </>
                )}
            </Form>
        </Accordion>
    );
};

export default withActiveElement()(LinkSettingsComponent);
