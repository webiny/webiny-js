// @flow
// $FlowFixMe
import React from "react";
import { get } from "lodash";
import { GET_PUBLISHED_FORM } from "./graphql";
import { Query } from "react-apollo";
import FormRender from "./FormRender";
import type { FormLoadComponentPropsType } from "@webiny/app-forms/types";

const FormLoad = (props: FormLoadComponentPropsType) => {
    const variables = {};
    if (props.slug) {
        variables.slug = props.slug;
        if (props.version) {
            variables.version = props.version;
        }
    } else if (props.parentId) {
        variables.parent = props.parentId;
    } else {
        variables.id = props.revisionId;
    }

    return (
        <Query query={GET_PUBLISHED_FORM} variables={variables}>
            {({ data, loading }) => {
                if (loading) {
                    // TODO: handle loading
                    return null;
                }

                const formData = get(data, "forms.getPublishedForm.data");
                if (!formData) {
                    // TODO: handle cannot load form
                    return <span>Form not found.</span>;
                }
                return <FormRender {...props} data={formData} />;
            }}
        </Query>
    );
};

export default FormLoad;
