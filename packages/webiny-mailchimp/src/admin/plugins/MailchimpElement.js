// @flow
import * as React from "react";
import { pure } from "recompose";
import { withTheme } from "webiny-app-cms/theme";
import { ElementStyle, getElementStyleProps } from "webiny-app-cms/render/components/ElementStyle";
import { Form } from "webiny-form";

const MailchimpElement = pure(({ element, theme }: Object) => {
    const { component: selected } = element.settings;
    const component = theme.elements.mailchimp.components.find(cmp => cmp.name === selected);

    let render = <span>Nothing selected.</span>;
    if (component) {
        const Component = component.component;
        render = (
            <Form>
                {props => {
                    const submit = () => {};
                    return <Component {...props} submit={submit} />;
                }}
            </Form>
        );
    }

    return (
        <ElementStyle
            key={component ? component.name : "no-component"}
            {...getElementStyleProps(element)}
            className={"webiny-cms-element-mailchimp"}
        >
            {render}
        </ElementStyle>
    );
});

export default withTheme()(MailchimpElement);
