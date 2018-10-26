// @flow
import React from "react";
import { Provider } from "react-redux";
import { compose } from "recompose";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import { createElement } from "webiny-app-cms/editor/utils";
import { redux } from "webiny-app-cms/editor/redux";
import { withRouter } from "webiny-app/components";
import { graphql, withApollo } from "react-apollo";
import { getPage } from "webiny-app-cms/admin/graphql/pages";
import { withSavedElements } from "webiny-app-cms/admin/components";
import Snackbar from "webiny-app-admin/plugins/Snackbar/Snackbar";

let store = null;

const Editor = ({ data, client, elements }: Object) => {
    if (data.loading || !Array.isArray(elements)) {
        return <div>Loading editor...</div>;
    }

    const { revisions, ...page } = data.cms.page.data;
    if (!page.content) {
        page.content = createElement("cms-element-document");
    }

    if (!store) {
        store = redux.initStore(
            {
                ui: {
                    activeElement: null,
                    dragging: false,
                    highlightElement: null,
                    plugins: {},
                    resizing: false
                },
                tmp: {},
                page,
                revisions
            },
            { client }
        );
    }

    return (
        <React.Fragment>
            <Provider store={store}>
                <CmsEditor />
            </Provider>
            <div style={{ zIndex: 10, position: "absolute" }}>
                <Snackbar />
            </div>
        </React.Fragment>
    );
};

export default compose(
    withApollo,
    withRouter(),
    withSavedElements(),
    graphql(getPage, {
        options: ({ router }) => {
            const { id } = router.getParams();
            return { variables: { id } };
        }
    })
)(Editor);
