import React from "react";
import { get } from "lodash";
import { GET_PUBLISHED_CONTENT_MODEL } from "./graphql";
import FormRender from "./FormRender";
import { FormLoadComponentPropsType } from "@webiny/app-headless-cms/types";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";

const FormLoad = (props: FormLoadComponentPropsType) => {
    const variables = {
        slug: null,
        id: null
    };

    if (props.slug) {
        variables.slug = props.slug;
    } else {
        variables.id = props.id;
    }

    const { data, loading } = useQuery(GET_PUBLISHED_CONTENT_MODEL, variables);

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
};

export default FormLoad;
