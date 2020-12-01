import React from "react";
import { css } from "emotion";
import { merge } from "dot-prop-immutable";
import { Switch } from "@webiny/ui/Switch";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { DelayedOnChange } from "@webiny/app-page-builder/editor/components/DelayedOnChange";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { PbElement } from "@webiny/app-page-builder/types";
// Components
import Accordion from "../components/Accordion";
import { ContentWrapper } from "../components/StyledComponents";
import Wrapper from "../components/Wrapper";
import InputField from "../components/InputField";

const classes = {
    gridClass: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

type LinkSettingsPropsType = {
    element: PbElement;
};
const LinkSettingsComponent: React.FunctionComponent<LinkSettingsPropsType> = ({ element }) => {
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
        <Accordion title={"Link"}>
            <Form data={{ href, newTab }} onChange={updateSettings}>
                {({ Bind }) => (
                    <ContentWrapper direction={"column"}>
                        <Grid className={classes.gridClass}>
                            <Cell span={12}>
                                <Bind
                                    name={"href"}
                                    validators={validation.create("url:allowRelative:allowHref")}
                                >
                                    <DelayedOnChange>
                                        {props => (
                                            <InputField
                                                value={props.value || ""}
                                                onChange={props.onChange}
                                                placeholder={"URL"}
                                            />
                                        )}
                                    </DelayedOnChange>
                                </Bind>
                            </Cell>
                        </Grid>
                        <Wrapper label={"New tab"} containerClassName={classes.gridClass}>
                            <Bind name={"newTab"}>
                                <Switch />
                            </Bind>
                        </Wrapper>
                    </ContentWrapper>
                )}
            </Form>
        </Accordion>
    );
};

export default withActiveElement()(LinkSettingsComponent);
