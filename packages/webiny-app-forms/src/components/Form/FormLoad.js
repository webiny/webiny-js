// @flow
// $FlowFixMe
import React from "react";
import { get } from "lodash";
import { getPublishedForm } from "./graphql";
import { Query } from "react-apollo";
import FormRender from "./FormRender";
import type { FormLoadComponentPropsType } from "webiny-app-forms/types";

const FormLoad = (props: FormLoadComponentPropsType) => {
    const variables = {};
    if (props.parent) {
        variables.parent = props.parent;
    } else {
        variables.id = props.revision;
    }

    return (
        <Query query={getPublishedForm} variables={variables}>
            {({ data, loading }) => {
                if (loading) {
                    // TODO: handle loading
                    return null;
                }

                return <FormRender {...props} data={get(data, "forms.getPublishedForm.data")} />;
            }}
        </Query>
    );
};

export default FormLoad;
