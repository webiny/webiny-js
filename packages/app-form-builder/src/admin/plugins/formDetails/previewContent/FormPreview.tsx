import * as React from "react";
import { css } from "emotion";
import { Form } from "@webiny/app-form-builder/components/Form";
import { DATA_FIELDS } from "@webiny/app-form-builder/components/Form/graphql";
import { Query } from "react-apollo";
import gql from "graphql-tag";
import { get } from "lodash";
import { FbFormModel } from "@webiny/app-form-builder/types";

const GET_FORM = gql`
    query GetForm($id: ID!) {
        forms {
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
    return (
        <Query query={GET_FORM} variables={{ id: revision.id }}>
            {data => (
                <div className={pageInnerWrapper}>
                    {revision && <Form preview data={get(data, "data.forms.getForm.data")} />}
                </div>
            )}
        </Query>
    );
};

export default FormPreview;
