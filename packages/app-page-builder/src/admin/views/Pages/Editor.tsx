import React, { useCallback } from "react";
import editorMock from "@webiny/app-page-builder/admin/assets/editor-mock.png";
import {
    createElementHelper,
    updateChildPathsHelper
} from "@webiny/app-page-builder/editor/helpers";
import { useRouter } from "@webiny/react-router";
import { Query } from "react-apollo";
import { Editor as PbEditor } from "@webiny/app-page-builder/editor";
import { GET_PAGE } from "@webiny/app-page-builder/admin/graphql/pages";
import { useSavedElements } from "@webiny/app-page-builder/admin/hooks/useSavedElements";
import Snackbar from "@webiny/app-admin/plugins/snackbar/Snackbar";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { DialogContainer } from "@webiny/app-admin/plugins/dialog/Dialog";
import { Typography } from "@webiny/ui/Typography";
import { LoadingEditor, LoadingTitle } from "./EditorStyled.js";

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

            if (!data?.pageBuilder?.page?.data) {
                return null;
            }

            const { revisions, content, ...restOfPageData } = data.pageBuilder.page.data as any;
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
            query={GET_PAGE()}
            variables={{ id: params.id }}
            onCompleted={data => {
                const error = data.pageBuilder?.page?.error?.message;
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
