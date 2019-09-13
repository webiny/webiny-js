import React, { useCallback } from "react";
import { Provider } from "react-redux";
import useReactRouter from "use-react-router";
import { Query, useApolloClient } from "react-apollo";
import { get } from "lodash";
import { Editor as PbEditor } from "@webiny/app-page-builder/editor";
import { createElement } from "@webiny/app-page-builder/editor/utils";
import { redux } from "@webiny/app-page-builder/editor/redux";
import { SETUP_EDITOR } from "@webiny/app-page-builder/editor/actions";
import { GET_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";
import { useSavedElements } from "@webiny/app-page-builder/admin/hooks/useSavedElements";
import Snackbar from "@webiny/app-admin/plugins/Snackbar/Snackbar";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";

import { Typography } from "@webiny/ui/Typography";
import { LoadingEditor, LoadingTitle } from "./EditorStyled.js";
import editorMock from "@webiny/app-page-builder/admin/assets/editor-mock.png";

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

const Editor = () => {
    const client = useApolloClient();
    const { match, history } = useReactRouter();
    const { showSnackbar } = useSnackbar();
    const ready = useSavedElements();

    const renderEditor = useCallback(
        ({ data, loading }) => {
            if (loading || !ready) {
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

            if (!get(data, "pageBuilder.page.data")) {
                return null;
            }

            if (!redux.store) {
                redux.initStore({}, { client });
            }

            if (!loading) {
                const { revisions, ...page } = data.pageBuilder.page.data;
                if (!page.content) {
                    page.content = createElement("document");
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
                        <PbEditor />
                    </Provider>
                    <div style={{ zIndex: 10, position: "absolute" }}>
                        <Snackbar />
                    </div>
                </React.Fragment>
            );
        },
        [ready]
    );

    return (
        <Query
            query={GET_PAGE()}
            variables={{ id: match.params.id }}
            onCompleted={data => {
                const error = get(data, "pageBuilder.page.error.message");
                if (error) {
                    history.push(`/page-builder/pages`);
                    showSnackbar(error);
                }
            }}
        >
            {renderEditor}
        </Query>
    );
};

export default Editor;
