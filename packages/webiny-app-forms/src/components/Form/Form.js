// @flow
import React, { useCallback, useEffect } from "react";
import { get, cloneDeep } from "lodash";
import { Form as WebinyForm } from "webiny-form";
import layoutRenderer from "./__sampleLayoutRenderer";
import getClientIp from "./getClientIp";
import renderFieldById from "./renderFieldById";
import { getForm } from "./graphql";
import { Query } from "react-apollo";

type Props = {
    preview?: boolean,
    data?: Object,
    id?: string
};

const DataForm = ({ preview, data }: Props) => {
    const { fields, layout } = data;
    if (!Array.isArray(layout)) {
        return null;
    }

    useEffect(() => {
        if (!preview) {
            // TODO: capture view
        }
    }, []);

    const onSubmitForm = useCallback(async ({ preview }) => {
        if (!preview) {
            const clientIp = await getClientIp();
        }

        console.log("submit");
    });

    return (
        <>
            {" "}
            <WebinyForm onSubmit={onSubmitForm}>
                {form => {
                    const render = cloneDeep(layout);
                    render.forEach(row => {
                        row.forEach((id, idIndex) => {
                            row[idIndex] = renderFieldById({ id, form, fields });
                        });
                    });

                    return layoutRenderer({
                        layout: render,
                        form: data,
                        submit: form.submit
                    });
                }}
            </WebinyForm>
        </>
    );
};

const IdForm = (props: Props) => {
    console.log('dobeo props', props)
    return (
        <Query query={getForm} variables={{ id: props.id }}>
            {({ data, loading }) => {
                if (loading) {
                    return null;
                }

                console.log("dobeo", data);
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
