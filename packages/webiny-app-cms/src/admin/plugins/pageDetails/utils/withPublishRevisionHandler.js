import React from "react";
import { compose, withHandlers } from "recompose";
import { get, set } from "dot-prop-immutable";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-app-admin/components";
import { loadPageRevisions, publishRevision, fragments } from "webiny-app-cms/admin/graphql/pages";

export default (prop: string) => {
    return compose(
        graphql(publishRevision, { name: "gqlPublish" }),
        withSnackbar(),
        withHandlers({
            [prop]: ({ pageId, gqlPublish, showSnackbar }) => async (revision: Object) => {
                const { data: res } = await gqlPublish({
                    variables: { id: revision.id },
                    update: (cache, { data }) => {
                        // Don't do anything if there was an error during publishing!
                        if (data.cms.publishRevision.error) {
                            return;
                        }

                        // Update page list item
                        const { activeRevision } = cache.readFragment({
                            id: pageId,
                            fragment: fragments.activeRevision
                        });

                        cache.writeFragment({
                            id: pageId,
                            fragment: fragments.activeRevision,
                            data: {
                                __typename: "Page",
                                activeRevision: {
                                    ...activeRevision,
                                    ...data.cms.publishRevision.data
                                }
                            }
                        });

                        // Get page revisions from cache
                        const pages = cache.readQuery({
                            query: loadPageRevisions,
                            variables: { id: pageId }
                        });

                        const revisions = get(pages, "cms.revisions.data");

                        revisions.forEach(r => {
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
                            query: loadPageRevisions,
                            data: set(pages, "cms.revisions.data", revisions)
                        });
                    }
                });

                const { error } = res.cms.publishRevision;
                if (error) {
                    return showSnackbar(error.message);
                }

                showSnackbar(
                    <span>
                    Successfully published revision <strong>{revision.name}</strong>!
                </span>
                );
            }
        })
    )
};
