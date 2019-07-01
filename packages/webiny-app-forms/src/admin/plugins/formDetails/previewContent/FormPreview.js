//@flow
import * as React from "react";
import { css } from "emotion";
import { Form } from "webiny-app-forms/components/Form";
import { Query } from "react-apollo";
import { DATA_FIELDS } from "webiny-app-forms/components/Form/graphql";
import gql from "graphql-tag";
import { get } from "lodash";

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
    padding: 25
});

type Props = {
    form: Object
};

const FormPreview = ({ form }: Props) => {
    return (
        <Query query={GET_FORM} variables={{ id: form.id }}>
            {data => (
                <div className={pageInnerWrapper}>
                    {form && <Form preview data={get(data, "data.forms.getForm.data")} />}
                </div>
            )}
        </Query>
    );
};

export default FormPreview;
