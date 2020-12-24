import React, { useCallback } from "react";
import editorMock from "@webiny/app-page-builder/admin/assets/editor-mock.png";
import {
    createElementHelper,
    updateChildPathsHelper
} from "@webiny/app-page-builder/editor/helpers";
import { useRouter } from "@webiny/react-router";
import { Query } from "react-apollo";
import { Editor as PbEditor } from "@webiny/app-page-builder/editor";
import { useSavedElements } from "@webiny/app-page-builder/admin/hooks/useSavedElements";
import Snackbar from "@webiny/app-admin/plugins/snackbar/Snackbar";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { DialogContainer } from "@webiny/app-admin/plugins/dialog/Dialog";
import { Typography } from "@webiny/ui/Typography";
import { LoadingEditor, LoadingTitle } from "./EditorStyled.js";

import gql from "graphql-tag";

const GET_PAGE = gql`
    query GetPage($id: ID!) {
        pageBuilder {
            getPage(id: $id) {
                data {
                    id
                    pid
                    title
                    path
                    version
                    locked
                    status
                    category {
                        url
                        name
                        slug
                    }
                    revisions {
                        id
                        title
                        status
                        locked
                        version
                    }
                    settings {
                        general {
                            snippet
                            tags
                            layout
                            image {
                                id
                                src
                            }
                        }
                        social {
                            meta {
                                property
                                content
                            }
                            title
                            description
                            image {
                                id
                                src
                            }
                        }
                        seo {
                            title
                            description
                            meta {
                                name
                                content
                            }
                        }
                    }
                    createdBy {
                        id
                    }
                    content
                }
                error {
                    message
                    data
                    code
                }
            }
        }
    }
`;

const extractPageGetPage = (data: any): any => {
    return data.pageBuilder?.getPage || {};
};

const extractPageData = (data: any): any => {
    const getPageData = extractPageGetPage(data);
    return getPageData.data;
};

const extractPageErrorData = (data: any): any => {
    const getPageData = extractPageGetPage(data);
    return getPageData.error || {};
};

const Editor: React.FunctionComponent = () => {
    const { match, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const ready = useSavedElements();

    const params: { id: string } = match.params as any;

    const renderEditor = useCallback(
        ({ data, loading }) => {
            if (loading || !ready) {
                return (
                    <LoadingEditor>
                        <img src={editorMock} alt={"page builder editor mock"} />
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
            if (!data) {
                return null;
            }

            const pageData = extractPageData(data);
            if (!pageData) {
                return null;
            }

            const { revisions = [], content, ...restOfPageData } = pageData;
            const page = {
                ...restOfPageData,
                content: content || updateChildPathsHelper(createElementHelper("document"))
            };

            return (
                <React.Fragment>
                    <PbEditor page={page} revisions={revisions} />
                    <div style={{ zIndex: 10, position: "absolute" }}>
                        <Snackbar />
                    </div>
                    <div>
                        <DialogContainer />
                    </div>
                </React.Fragment>
            );
        },
        [ready]
    );

    return (
        <Query
            query={GET_PAGE}
            variables={{ id: decodeURIComponent(params.id) }}
            onCompleted={data => {
                const errorData = extractPageErrorData(data);
                const error = errorData.message;
                if (!error) {
                    return;
                }
                history.push(`/page-builder/pages`);
                showSnackbar(error);
            }}
        >
            {renderEditor}
        </Query>
    );
};

export default Editor;
