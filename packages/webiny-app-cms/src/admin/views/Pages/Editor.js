// @flow
import React from "react";
import { Provider } from "react-redux";
import { compose } from "recompose";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import { createElement } from "webiny-app-cms/editor/utils";
import { redux } from "webiny-app-cms/editor/redux";
import { withRouter } from "webiny-app/components";
import { graphql, withApollo } from "react-apollo";
import { loadEditorData } from "webiny-app-cms/admin/graphql/pages";

const Editor = ({ data, client }: Object) => {
    if (data.loading) {
        return <div>Loading editor...</div>;
    }

    const revision = data.cms.revision.data;
    if (!revision.content) {
        revision.content = createElement("cms-element-document");
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
                        revision
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
