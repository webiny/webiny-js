// @flow
import React, { useCallback, useEffect } from "react";
import { getPlugin } from "webiny-plugins";
import { get, cloneDeep } from "lodash";
import { Form as WebinyForm } from "webiny-form";
import getClientIp from "./getClientIp";
import renderFieldById from "./renderFieldById";
import { getForm } from "./graphql";
import { Query } from "react-apollo";
import type { FormLayoutPluginType } from "webiny-app-forms/types";

type Props = {
    preview?: boolean,
    data?: Object,
    id?: string
};

const DataForm = ({ preview, data }: Props) => {
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

    const layoutRendererPlugin: ?FormLayoutPluginType = getPlugin(settings.layout.renderer);
    if (!layoutRendererPlugin) {
        return <span>Cannot render form, no layout selected.</span>;
    }

    return (
        <WebinyForm onSubmit={onSubmitForm}>
            {form => {
                const layoutFields = cloneDeep(layout);
                layoutFields.forEach(row => {
                    row.forEach((id, idIndex) => {
                        row[idIndex] = renderFieldById({ id, form, fields });
                    });
                });

                return layoutRendererPlugin.render({
                    layout: layoutFields,
                    form: data,
                    submit: form.submit
                });
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

                return <DataForm data={get(data, "forms.getForm.data")} />;
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

export default Form;
