import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { Form } from "@webiny/form";
import { get } from "lodash";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementMailchimpComponentPlugin } from "../../types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-mailchimp/admin");

const MailchimpElement = React.memo(({ element }: any) => {
    const selected = get(element, "data.settings.component", get(element, "settings.component"));
    const component = getPlugins<PbPageElementMailchimpComponentPlugin>(
        "pb-page-element-mailchimp-component"
    ).find(cmp => cmp.componentName === selected);

    let render = <span>{t`You must configure your embed in the settings!`}</span>;

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
