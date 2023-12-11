import * as React from "react";
import { css } from "emotion";
import { Form } from "../../../../components/Form";
import { DATA_FIELDS } from "~/components/Form/graphql";
import { useQuery } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { FbErrorResponse, FbFormModel, FbRevisionModel } from "~/types";
import CircularProgress from "@webiny/ui/Progress/CircularProgress";

interface GetFormQueryResponse {
    formBuilder: {
        getForm: {
            data: FbFormModel;
            error?: FbErrorResponse;
        };
    };
}
interface GetFormQueryVariables {
    revision: string;
}
const GET_FORM = gql`
    query FbGetFullForm($revision: ID!) {
        formBuilder {
            getForm(revision: $revision) {
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

interface FormPreviewProps {
    revision: FbRevisionModel;
    form: FbFormModel;
}

const FormPreview = ({ revision }: FormPreviewProps) => {
    const { data, error, loading } = useQuery<GetFormQueryResponse, GetFormQueryVariables>(
        GET_FORM,
        {
            variables: {
                revision: revision.id
            }
        }
    );

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        console.error(error.message, error);
        return (
            <div className={pageInnerWrapper}>
                Form data could not be loaded. Check browser console for errors.
            </div>
        );
    }

    return (
        <div className={pageInnerWrapper}>
            {revision && <Form preview data={data?.formBuilder?.getForm?.data} />}
        </div>
    );
};

export default FormPreview;
