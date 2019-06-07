// @flow
import { compose, withHandlers } from "recompose";
import { withRouter } from "react-router-dom";
import { graphql } from "react-apollo";
import { createRevisionFrom, deleteRevision } from "webiny-app-cms/admin/graphql/pages";
import withPublishRevisionHandler from "../utils/withPublishRevisionHandler";

export default compose(
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    graphql(deleteRevision, { name: "gqlDelete" }),
    withPublishRevisionHandler("publishRevision"),
    withRouter,
    withHandlers({
        createRevision: ({ rev, history, gqlCreate, showSnackbar }: Object) => async () => {
            const { data: res } = await gqlCreate({
                variables: { revision: rev.id },
                refetchQueries: ["CmsListPages"]
            });
            const { data, error } = res.cms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            history.push(`/cms/editor/${data.id}`);
        },
        editRevision: ({ rev, history }) => () => {
            history.push(`/cms/editor/${rev.id}`);
        },
        deleteRevision: ({
            rev,
            form: { page },
            gqlDelete,
            showSnackbar,
            history
        }) => async () => {
            const { data: res } = await gqlDelete({
                refetchQueries: ["CmsLoadPageRevisions"],
                variables: { id: rev.id }
            });
            const { error } = res.cms.deleteRevision;
            if (error) {
                return showSnackbar(error.message);
            }

            if (rev.id === page.id) {
                history.push("/cms/pages");
            }
        }
    })
);
