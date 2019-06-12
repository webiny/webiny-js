// @flow
import React, { useCallback, useEffect } from "react";
import { get, cloneDeep } from "lodash";
import getClientIp from "./getClientIp";
import { getForm } from "./graphql";
import { Query } from "react-apollo";
import { withCms } from "webiny-app-cms/context";
import type { FormRenderPropsType } from "webiny-app-forms/types";

type Props = {
    preview?: boolean,
    data?: Object,
    id?: string
};

const DataForm = ({ preview, data, cms }: Props) => {
    const { layout, fields, settings } = data;
    useEffect(() => {
        if (!preview) {
            // TODO: capture view
        }
    }, []);

    const submit = useCallback(async () => {
        if (!preview) {
            const clientIp = await getClientIp();
        }
        // TODO : submit
    }, []);

    const getFieldById = useCallback(id => {
        return fields.find(field => field.id === id);
    }, []);

    const getFieldByFieldId = useCallback(id => {
        return fields.find(field => field.fieldId === id);
    }, []);

    const getFields = useCallback(() => {
        const fields = cloneDeep(layout);
        fields.forEach(row => {
            row.forEach((id, idIndex) => {
                row[idIndex] = getFieldById(id);
            });
        });
        return fields;
    }, []);

    const getDefaultValues = useCallback(() => {
        const values = {};
        fields.forEach(field => {
            if ("defaultValue" in field && typeof field.defaultValue !== "undefined") {
                values[field.fieldId] = field.defaultValue;
            }
        });
        return values;
    }, []);

    if (!data) {
        // TODO: handle this
        return null;
    }

    // Get form layout, defined in theme.
    let LayoutRenderComponent = get(cms, "theme.forms.layouts", []).find(
        item => item.name === settings.layout.renderer
    );

    if (!LayoutRenderComponent) {
        return <span>Cannot render form, layout missing.</span>;
    }

    LayoutRenderComponent = LayoutRenderComponent.component;

    const props: FormRenderPropsType = {
        getFieldById,
        getFieldByFieldId,
        getDefaultValues,
        getFields,
        submit,
        form: data
    };

    return <LayoutRenderComponent {...props} />;
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
