import React from "react";
import { GET_PUBLISHED_FORM } from "./graphql";
import { useQuery } from "react-apollo";
import FormRender from "./FormRender";
import { FormLoadComponentPropsType } from "@webiny/app-form-builder/types";

const FormLoad = (props: FormLoadComponentPropsType) => {
    const variables = {
        slug: null,
        version: null,
        parent: null,
        id: null
    };

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

    const { data, loading, error } = useQuery(GET_PUBLISHED_FORM, {
        variables
    });

    if (error) {
        return (
            <React.Fragment>
                <details>
                    <summary>{error.message || "Something went wrong!"}</summary>
                    {error.stack}
                </details>
            </React.Fragment>
        );
    }

    if (loading) {
        // TODO: handle loading
        return <span>Loading...</span>;
    }

    const formData = data?.formBuilder?.getPublishedForm?.data;
    const formError = data?.formBuilder?.getPublishedForm?.error;

    if (!formData) {
        // TODO: handle cannot load form
        return <span>{formError?.message || "Form not found."}</span>;
    }
    return <FormRender {...props} data={formData} />;
};

export default FormLoad;
