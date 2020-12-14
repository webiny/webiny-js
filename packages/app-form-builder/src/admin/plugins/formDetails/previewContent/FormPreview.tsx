import * as React from "react";
import { css } from "emotion";
import { Form } from "@webiny/app-form-builder/components/Form";
import { DATA_FIELDS } from "@webiny/app-form-builder/components/Form/graphql";
import { useQuery } from "react-apollo";
import gql from "graphql-tag";
import { FbFormModel } from "@webiny/app-form-builder/types";
import CircularProgress from "@webiny/ui/Progress/CircularProgress";

const GET_FORM = gql`
    query FbGetForm($id: ID!) {
        formBuilder {
            getForm(id: $id) {
                data {
                    ${DATA_FIELDS}
                }
                error {
                    message
                }
            }
        }
    }
`;

const pageInnerWrapper = css({
    overflowY: "scroll",
    overflowX: "hidden",
    maxHeight: "calc(100vh - 290px)",
    position: "relative",
    padding: 25,
    backgroundColor: "var(--webiny-theme-color-surface, #fff) !important"
});

type FormPreviewProps = {
    revision: FbFormModel;
    form: FbFormModel;
};

const FormPreview = ({ revision }: FormPreviewProps) => {
    const { data, loading } = useQuery(GET_FORM, {
        variables: {
            id: revision.id
        }
    });

    if (loading) {
        return <CircularProgress />;
    }

    return (
        <div className={pageInnerWrapper}>
            {revision && <Form preview data={data?.formBuilder?.getForm?.data} />}
        </div>
    );
};

export default FormPreview;
