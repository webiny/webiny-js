// @flow
import React from "react";
import { connect } from "react-redux";
import { compose, lifecycle } from "recompose";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import { setEditorData } from "webiny-app-cms/editor/actions";
import { withRouter } from "webiny-app/components";
import { graphql } from "react-apollo";
import { loadEditorData } from "./graphql/pages";

const Editor = ({ data }: Object) => {
    if (data.loading) {
        return <div>Loading editor...</div>;
    }

    return <CmsEditor />;
};

export default compose(
    connect(
        null,
        { setEditorData }
    ),
    withRouter(),
    graphql(loadEditorData, {
        options: ({ router, setEditorData }) => {
            const { page, revision } = router.getParams();
            return {
                variables: { page, revision },
                onCompleted(data) {
                    setEditorData({
                        revision: data.Cms.Revisions.one,
                        page: data.Cms.Pages.one
                    });
                }
            };
        }
    })
)(Editor);
