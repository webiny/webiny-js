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
        createRevision: ({ rev, router, gqlCreate, showSnackbar }: Object) => async () => {
            const { data: res } = await gqlCreate({
                variables: { revision: rev.id }
            });
            const { data, error } = res.cms.revision;

            if (error) {
                return showSnackbar(error.message);
            }

            router.goToRoute({ name: "Cms.Editor", params: { id: data.id } });
        },
        editRevision: ({ rev, router }) => () => {
            router.goToRoute({ name: "Cms.Editor", params: { id: rev.id } });
        },
        deleteRevision: ({
            rev,
            pageDetails: { page },
            gqlDelete,
            showSnackbar,
            router
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
                router.goToRoute({ params: { id: null } });
            }
        }
    })
);
