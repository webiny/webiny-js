import React from "react";
import { Form } from "@webiny/app-headless-cms/components/Form";
import { useQuery } from "@webiny/app-headless-cms/admin/hooks";
import { GET_CONTENT_MODEL_BY_MODEL_ID } from "./graphql";

function ContentForm() {
    const getContentModelByModelId = useQuery(GET_CONTENT_MODEL_BY_MODEL_ID);
    console.log(getContentModelByModelId);
    return null;
    return <Form />;
}

export default ContentForm;
