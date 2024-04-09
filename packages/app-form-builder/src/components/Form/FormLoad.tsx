import React from "react";
import {
    GET_PUBLISHED_FORM,
    GetPublishedFormQueryResponse,
    GetPublishedFormQueryVariables
} from "./graphql";
import { useQuery } from "@apollo/react-hooks";
import FormRender from "./FormRender";
import { FormLoadComponentPropsType } from "~/types";

const FormLoad = (props: FormLoadComponentPropsType) => {
    const variables: GetPublishedFormQueryVariables = {};

    if (props.parentId) {
        variables["parent"] = props.parentId;
    } else {
        variables["revision"] = props.revisionId;
    }

    const { data, loading, error } = useQuery<
        GetPublishedFormQueryResponse,
        GetPublishedFormQueryVariables
    >(GET_PUBLISHED_FORM, {
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

    if (loading || !data) {
        return <span>Loading...</span>;
    }

    const { data: formData, error: formError } = data.formBuilder.getPublishedForm;

    if (!formData) {
        // TODO: handle cannot load form
        return <span>{formError?.message || "Form not found."}</span>;
    }
    return <FormRender {...props} data={formData} />;
};

export default FormLoad;
