// @flow
import React from "react";
import { compose, withHandlers } from "recompose";
import { set } from "dot-prop-immutable";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import { publishRevision, getPage } from "webiny-app-cms/admin/graphql/pages";

export default (prop: string) => {
    return compose(
        graphql(publishRevision, { name: "gqlPublish" }),
        withSnackbar(),
        withHandlers({
            [prop]: ({ pageDetails: { page }, gqlPublish, showSnackbar }) => async (
                revision: Object
            ) => {
                const { data: res } = await gqlPublish({
                    variables: { id: revision.id },
                    refetchQueries: ["CmsListPages"],
                    update: (cache, { data }) => {
                        // Don't do anything if there was an error during publishing!
                        if (data.cms.publishRevision.error) {
                            return;
                        }

                        const getPageQuery = getPage();

                        // Update revisions
                        const pageFromCache = cache.readQuery({
                            query: getPageQuery,
                            variables: { id: page.id }
                        });

                        page.revisions.forEach(r => {
                            // Update published/locked fields on the revision that was just published.
                            if (r.id === revision.id) {
                                r.published = true;
                                r.locked = true;
                                return;
                            }

                            // Unpublish other published revisions
                            if (r.published) {
                                r.published = false;
                            }
                        });

                        // Write our data back to the cache.
                        cache.writeQuery({
                            query: getPageQuery,
                            data: set(pageFromCache, "cms.page.data", page)
                        });
                    }
                });

                const { error } = res.cms.publishRevision;
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
