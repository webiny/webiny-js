// @flow
import React from "react";
import { compose, withHandlers } from "recompose";
import { get, set } from "dot-prop-immutable";
import { graphql } from "react-apollo";
import { loadPageRevisions } from "webiny-app-cms/admin/graphql/pages";
import {
    createRevisionFrom,
    publishRevision,
    deleteRevision,
    activeRevisionFragment
} from "./graphql";

export default compose(
    graphql(createRevisionFrom, { name: "gqlCreate" }),
    graphql(publishRevision, { name: "gqlPublish" }),
    graphql(deleteRevision, { name: "gqlDelete" }),
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
        publishRevision: ({ rev, pageId, gqlPublish, showSnackbar }) => async () => {
            const { data: res } = await gqlPublish({
                variables: { id: rev.id },
                update: (cache, { data }) => {
                    // Don't do anything if there was an error during publishing!
                    if (data.cms.publishRevision.error) {
                        return;
                    }

                    // Update page list item
                    const { activeRevision } = cache.readFragment({
                        id: pageId,
                        fragment: activeRevisionFragment
                    });

                    cache.writeFragment({
                        id: pageId,
                        fragment: activeRevisionFragment,
                        data: {
                            __typename: "Page",
                            activeRevision: {
                                ...activeRevision,
                                ...data.cms.publishRevision.data
                            }
                        }
                    });

                    // Get page revisions cache
                    const pages = cache.readQuery({
                        query: loadPageRevisions,
                        variables: { id: pageId }
                    });

                    const revisions = get(pages, "cms.revisions.data");

                    revisions.forEach(r => {
                        // Update published/locked fields on the revision that was just published.
                        if (r.id === rev.id) {
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
                    Successfully published revision <strong>{rev.name}</strong>!
                </span>
            );
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
