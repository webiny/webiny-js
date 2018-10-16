// @flow
import React from "react";
import { Provider } from "react-redux";
import { compose, lifecycle } from "recompose";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import { redux } from "webiny-app-cms/editor/redux";
import { withRouter } from "webiny-app/components";
import { graphql, withApollo } from "react-apollo";
import { loadEditorData } from "./graphql";

const Editor = ({ data, client }: Object) => {
    if (data.loading) {
        return <div>Loading editor...</div>;
    }

    return (
        <Provider
            store={redux.initStore(
                {
                    editor: {
                        ui: {
                            activeElement: null,
                            dragging: false,
                            highlightElement: null,
                            plugins: {},
                            resizing: false
                        },
                        tmp: {},
                        page: data.cms.page.data,
                        revision: data.cms.revision.data
                    }
                },
                { client }
            )}
        >
            <CmsEditor />
        </Provider>
    );
};

export default compose(
    withApollo,
    withRouter(),
    graphql(loadEditorData, {
        options: ({ router }) => {
            const { page, revision } = router.getParams();
            return {
                variables: { page, revision }
            };
        }
    })
)(Editor);
