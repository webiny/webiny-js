// @flow
import React from "react";
import { Provider } from "react-redux";
import { connect } from "react-redux";
import { compose, lifecycle } from "recompose";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import { createElement } from "webiny-app-cms/editor/utils";
import { redux } from "webiny-app-cms/editor/redux";
import { SETUP_EDITOR } from "webiny-app-cms/editor/actions";
import { withRouter } from "webiny-app/components";
import { graphql, withApollo } from "react-apollo";
import { getPage } from "webiny-app-cms/admin/graphql/pages";
import { withSavedElements } from "webiny-app-cms/admin/components";
import Snackbar from "webiny-app-admin/plugins/Snackbar/Snackbar";

const getEmptyData = (page = {}, revisions = []) => {
    return {
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
    };
};

const Editor = ({ loading, elements }: Object) => {
    if (loading || !Array.isArray(elements)) {
        return <div>Loading editor...</div>;
    }

    return (
        <React.Fragment>
            <Provider store={redux.store}>
                <CmsEditor />
            </Provider>
            <div style={{ zIndex: 10, position: "absolute" }}>
                <Snackbar />
            </div>
        </React.Fragment>
    );
};

let pageSet = null;

export default compose(
    withApollo,
    withRouter(),
    withSavedElements(),
    graphql(getPage, {
        props: ({ data, ownProps }) => {
            if (!redux.store) {
                redux.initStore({}, { client: ownProps.client });
            }

            if (!data.loading) {
                const { revisions, ...page } = data.cms.page.data;
                if (!page.content) {
                    page.content = createElement("cms-element-document");
                }

                if (pageSet !== page.id) {
                    pageSet = page.id;
                    redux.store.dispatch({
                        type: SETUP_EDITOR,
                        payload: getEmptyData(page, revisions)
                    });
                    redux.store.dispatch({ type: "@@redux-undo/INIT" });
                }
            }

            return {
                elements: ownProps.elements,
                loading: data.loading
            };
        },
        options: ({ router }) => {
            const { id } = router.getParams();
            return {
                variables: { id }
            };
        }
    })
)(Editor);
