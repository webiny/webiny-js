// @flow
// $FlowFixMe
import React from "react";
import { get } from "lodash";
import { getForm } from "./graphql";
import { Query } from "react-apollo";
import FormRender from "./FormRender";
import type { FormLoadComponentPropsType } from "webiny-app-forms/types";

const FormLoad = (props: FormLoadComponentPropsType) => {
    return (
        <Query query={getForm} variables={{ id: props.id }}>
            {({ data, loading }) => {
                if (loading) {
                    // TODO: handle loading
                    return null;
                }

                return <FormRender {...props} data={get(data, "forms.getForm.data")} />;
            }}
        </Query>
    );
};

export default FormLoad;
