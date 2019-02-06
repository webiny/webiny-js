// @flow
import * as React from "react";
import { pure } from "recompose";
import { withCms } from "webiny-app-cms/context";
import { ElementRoot } from "webiny-app-cms/render/components/ElementRoot";
import { Form } from "webiny-form";
import { Mutation } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { getPlugins } from "webiny-plugins";

const mutation = gql`
    mutation addToList($email: String!, $list: String!) {
        mailchimp {
            addToList(email: $email, list: $list) {
                error {
                    message
                }
            }
        }
    }
`;

const MailchimpElement = pure((props: Object) => {
    const { element } = props;
    let selected = get(element, "data.settings.component", get(element, "settings.component"));
    const component = getPlugins("cms-element-mailchimp-component").find(
        cmp => cmp.name === selected
    );

    let render = <span>Nothing selected.</span>;
    if (component) {
        const Component = component.component;
        render = (
            <Mutation mutation={mutation}>
                {update => {
                    return (
                        <Form key={component.name}>
                            {form => {
                                return (
                                    <Component
                                        {...form}
                                        submit={async () => {
                                            await form.submit();
                                            await update({
                                                variables: form.data
                                            });
                                        }}
                                    />
                                );
                            }}
                        </Form>
                    );
                }}
            </Mutation>
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

export default withCms()(MailchimpElement);
