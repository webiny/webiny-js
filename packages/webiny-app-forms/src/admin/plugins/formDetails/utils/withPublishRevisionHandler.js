// @flow
import React from "react";
import { compose, withHandlers } from "recompose";
import { set } from "dot-prop-immutable";
import { graphql } from "react-apollo";
import { withSnackbar } from "webiny-admin/components";
import { publishRevision, getForm } from "webiny-app-forms/admin/viewsGraphql";

export default (prop: string) => {
    return compose(
        graphql(publishRevision, { name: "gqlPublish" }),
        withSnackbar(),
        withHandlers({
            [prop]: ({ form: { form }, gqlPublish, showSnackbar }) => async (
                revision: Object
            ) => {
                const { data: res } = await gqlPublish({
                    variables: { id: revision.id },
                    refetchQueries: ["CmsListForms"],
                    update: (cache, { data }) => {
                        // Don't do anything if there was an error during publishing!
                        if (data.forms.publishRevision.error) {
                            return;
                        }

                        // Update revisions
                        const formFromCache = cache.readQuery({
                            query: getForm,
                            variables: { id: form.id }
                        });

                        form.revisions.forEach(r => {
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
                            query: getForm,
                            data: set(formFromCache, "forms.form.data", form)
                        });
                    }
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
