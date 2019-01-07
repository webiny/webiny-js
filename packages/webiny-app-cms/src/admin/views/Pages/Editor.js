// @flow
import React from "react";
import { Provider } from "react-redux";
import { compose, withHandlers } from "recompose";
import { Editor as CmsEditor } from "webiny-app-cms/editor";
import { createElement } from "webiny-app-cms/editor/utils";
import { redux } from "webiny-app-cms/editor/redux";
import { SETUP_EDITOR } from "webiny-app-cms/editor/actions";
import { withRouter } from "webiny-app/components";
import { Query, withApollo } from "react-apollo";
import { getPage } from "webiny-app-cms/admin/graphql/pages";
import { withSavedElements } from "webiny-app-cms/admin/components";
import Snackbar from "webiny-admin/plugins/Snackbar/Snackbar";
import { withSnackbar } from "webiny-admin/components";

import { Typography } from "webiny-ui/Typography";
import { LoadingEditor, LoadingTitle } from "./EditorStyled.js";
import editorMock from "webiny-app-cms/admin/assets/editor-mock.png";
import { get } from "lodash";
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

let pageSet = null;

const Editor = ({ renderEditor, router, showSnackbar }: Object) => {
    return (
        <Query
            query={getPage()}
            variables={{ id: router.getParams("id") }}
            onCompleted={data => {
                const error = get(data, "cms.page.error.message");
                if (error) {
                    router.goToRoute({
                        name: "Cms.Pages",
                        params: { id: null },
                        merge: true
                    });
                    showSnackbar(error);
                }
            }}
        >
            {renderEditor}
        </Query>
    );
};

export default compose(
    withApollo,
    withRouter(),
    withSnackbar(),
    withSavedElements(),
    withHandlers({
        // eslint-disable-next-line react/display-name
        renderEditor: ({ elements, client }) => ({ data, loading }) => {
            if (loading || !Array.isArray(elements)) {
                return (
                    <LoadingEditor>
                        <img src={editorMock} />
                        <LoadingTitle>
                            <Typography tag={"div"} use={"headline6"}>
                                Loading Editor<span>.</span>
                                <span>.</span>
                                <span>.</span>
                            </Typography>
                        </LoadingTitle>
                    </LoadingEditor>
                );
            }

            if (!get(data, "cms.page.data")) {
                return null;
            }

            if (!redux.store) {
                redux.initStore({}, { client });
            }

            if (!loading) {
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
        }
    })
)(Editor);
