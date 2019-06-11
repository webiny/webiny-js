// @flow
import React, { useCallback, useEffect } from "react";
import { get, cloneDeep } from "lodash";
import { Form as WebinyForm } from "webiny-form";
import getClientIp from "./getClientIp";
import renderFieldById from "./renderFieldById";
import { getForm } from "./graphql";
import { Query } from "react-apollo";
import { withCms } from "webiny-app-cms/context";

type Props = {
    preview?: boolean,
    data?: Object,
    id?: string
};

const DataForm = ({ preview, data, cms }: Props) => {
    useEffect(() => {
        if (!preview) {
            // TODO: capture view
        }
    }, []);

    const onSubmitForm = useCallback(async ({ preview }) => {
        if (!preview) {
            const clientIp = await getClientIp();
        }
        // TODO : submit
    });

    if (!data) {
        return null;
    }

    const { layout, fields, settings } = data;

    let LayoutRenderComponent = get(cms, "theme.forms.layouts", []).find(
        item => item.name === settings.layout.renderer
    );

    console.log(cms,settings)
    if (!LayoutRenderComponent) {
        return <span>Cannot render form, layout missing.</span>;
    }

    LayoutRenderComponent = LayoutRenderComponent.component;

    return (
        <WebinyForm onSubmit={onSubmitForm}>
            {form => {
                const layoutFields = cloneDeep(layout);
                layoutFields.forEach(row => {
                    row.forEach((id, idIndex) => {
                        row[idIndex] = renderFieldById({ id, form, fields });
                    });
                });

                const props = {
                    layout: layoutFields,
                    form: data,
                    submit: form.submit
                };

                return <LayoutRenderComponent {...props} />;
            }}
        </WebinyForm>
    );
};

const IdForm = (props: Props) => {
    return (
        <Query query={getForm} variables={{ id: props.id }}>
            {({ data, loading }) => {
                if (loading) {
                    return null;
                }

                return <DataForm {...props} data={get(data, "forms.getForm.data")} />;
            }}
        </Query>
    );
};

const Form = (props: Props) => {
    if (props.id) {
        return <IdForm {...props} />;
    }

    if (props.data) {
        return <DataForm {...props} />;
    }

    return null;
};

export default withCms()(Form);
