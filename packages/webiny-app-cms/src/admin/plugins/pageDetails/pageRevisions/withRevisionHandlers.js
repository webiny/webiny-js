// @flow
import { compose, withHandlers } from "recompose";
import { graphql } from "react-apollo";
import { createRevisionFrom, deleteRevision } from "webiny-app-cms/admin/graphql/pages";
import withPublishRevisionHandler from "../utils/withPublishRevisionHandler";

export default compose(
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    graphql(deleteRevision, { name: "gqlDelete" }),
    withPublishRevisionHandler("publishRevision"),
    withHandlers({
        createRevision: ({ rev, router, pageId, gqlCreate, showSnackbar }: Object) => async (
            formData: Object
        ) => {
            const { data: res } = await gqlCreate({
                variables: { revisionId: rev.id, name: formData.name }
            });
            const { data, error } = res.cms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            router.goToRoute({
                name: "Cms.Editor",
                params: { page: pageId, revision: data.id }
            });
        },
        editRevision: ({ rev, router, pageId }) => () => {
            router.goToRoute({ name: "Cms.Editor", params: { page: pageId, revision: rev.id } });
        },
        deleteRevision: ({ rev, gqlDelete, showSnackbar }) => async () => {
            const { data: res } = await gqlDelete({
                refetchQueries: ["CmsLoadPageRevisions"],
                variables: { id: rev.id }
            });
            const { error } = res.cms.deleteRevision;
            if (error) {
                return showSnackbar(error.message);
            }
        }
    })
);
