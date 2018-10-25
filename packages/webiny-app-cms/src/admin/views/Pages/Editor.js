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

const Editor = ({ data, client }: Object) => {
    if (data.loading) {
        return <div>Loading editor...</div>;
    }

    const { revisions, ...page } = data.cms.page.data;
    if (!page.content) {
        page.content = createElement("cms-element-document");
    }

    return (
        <Provider
            store={redux.initStore(
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
            )}
        >
            <CmsEditor />
        </Provider>
    );
};

export default compose(
    withApollo,
    withRouter(),
    graphql(getPage, {
        options: ({ router }) => {
            const { id } = router.getParams();
            return { variables: { id } };
        }
    })
)(Editor);
