// @flow
import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Form } from "@webiny/form";
import { get } from "lodash";
import { getPlugins } from "@webiny/plugins";

const MailchimpElement = React.memo(({ element }: *) => {
    let selected = get(element, "data.settings.component", get(element, "settings.component"));
    const component = getPlugins("pb-page-element-mailchimp-component").find(
        cmp => cmp.componentName === selected
    );

    let render = <span>You must configure your embed in the settings!</span>;

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
            className={"webiny-pb-page-element-mailchimp"}
        >
            {render}
        </ElementRoot>
    );
});

MailchimpElement.displayName = "MailchimpElement";

export default MailchimpElement;
