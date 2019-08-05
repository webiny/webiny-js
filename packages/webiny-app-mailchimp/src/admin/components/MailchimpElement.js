// @flow
import * as React from "react";
import { pure } from "recompose";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import { Form } from "webiny-form";
import { get } from "lodash";
import { getPlugins } from "webiny-plugins";

const MailchimpElement = pure(({ element }: *) => {
    let selected = get(element, "data.settings.component", get(element, "settings.component"));
    const component = getPlugins("cms-element-mailchimp-component").find(
        cmp => cmp.name === selected
    );

    let render = <span>Nothing selected.</span>;
    if (component) {
        const Component = component.component;
        render = (
            <Form key={component.name}>
                {({ form }) => (
                    <Component
                        processing={false} // It will suffice for editor preview needs.
                        {...form}
                        submit={async ({ onSuccess }) => {
                            if (await form.validate()) {
                                form.submit();
                                onSuccess && onSuccess();
                            }
                        }}
                    />
                )}
            </Form>
        );
    }

    return (
        <ElementRoot
            key={component ? component.name : "no-component"}
            element={element}
            className={"webiny-cms-element-mailchimp"}
        >
            {render}
        </ElementRoot>
    );
});

export default MailchimpElement;
