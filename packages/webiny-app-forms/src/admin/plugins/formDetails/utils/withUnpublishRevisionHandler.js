// @flow
import React from "react";
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import { unpublishRevision } from "webiny-app-forms/admin/viewsGraphql";

export default (prop: string) => {
    return compose(
        graphql(unpublishRevision, { name: "gqlUnpublish" }),
        withSnackbar(),
        withHandlers({
            [prop]: ({ revision, gqlPublish, showSnackbar }) => async () => {
                const { data: res } = await gqlPublish({
                    variables: { id: revision.id },
                    refetchQueries: ["FormsListForms"]
                });

                const { error } = res.forms.publishRevision;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(
                    <span>
                        Successfully published revision <strong>#{revision.version}</strong>!
                    </span>
                );
            }
        })
    );
};
