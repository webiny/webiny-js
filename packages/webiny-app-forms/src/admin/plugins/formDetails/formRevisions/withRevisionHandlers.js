// @flow
import { compose, withHandlers } from "recompose";
import { withRouter } from "react-router-dom";
import { graphql } from "react-apollo";
import {
    getForm,
    unpublishRevision,
    createRevisionFrom,
    deleteRevision
} from "webiny-app-forms/admin/viewsGraphql";
import withPublishRevisionHandler from "../utils/withPublishRevisionHandler";
import { cloneDeep, get } from "lodash";

export default compose(
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    graphql(deleteRevision, { name: "gqlDelete" }),
    graphql(unpublishRevision, { name: "gqlUnpublishRevision" }),
    withPublishRevisionHandler("publishRevision"),
    withRouter,
    withHandlers({
        createRevision: ({
            revision: rev,
            history,
            gqlCreate,
            showSnackbar
        }: Object) => async () => {
            const { data: res } = await gqlCreate({
                variables: { revision: rev.id },
                refetchQueries: ["FormsListForms"]
            });
            const { data, error } = res.forms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            history.push(`/forms/${data.id}`);
        },
        editRevision: ({ revision: rev, history }) => () => {
            history.push(`/forms/${rev.id}`);
        },
        deleteRevision: ({ revision: rev, form, gqlDelete, showSnackbar, history }) => async () => {
            await gqlDelete({
                variables: { id: rev.id },
                refetchQueries: ["FormsListForms"],
                update: (cache, updated) => {
                    const error = get(updated, "data.forms.deleteRevision.error");
                    if (error) {
                        return showSnackbar(error.message);
                    }

                    // Should we redirect to list (remove "?id=XYZ" from URL?):
                    // If parent was deleted, that means all revisions were deleted, and we can redirect.
                    if (rev.parent === rev.id) {
                        return history.push("/forms");
                    }

                    const gqlParams = { query: getForm, variables: { id: form.id } };
                    const data = cloneDeep(cache.readQuery(gqlParams));
                    const indexOfDeleted = data.forms.form.data.revisions.findIndex(
                        item => item.id === rev.id
                    );

                    data.forms.form.data.revisions.splice(indexOfDeleted, 1);
                    cache.writeQuery({
                        ...gqlParams,
                        data
                    });

                    // If currently selected revision (from left list of forms) was deleted.
                    if (rev.id === form.id) {
                        return history.push("/forms");
                    }
                }
            });
        },
        unpublishRevision: ({ revision: rev, gqlUnpublishRevision }) => async () => {
            await gqlUnpublishRevision({
                variables: { id: rev.id },
                refetchQueries: ["FormsListForms"]
            });
        }
    })
);
