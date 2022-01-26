import React, { useCallback, useState } from "react";
import editorMock from "../../assets/editor-mock.png";
import { createElement } from "~/editor/helpers";
import { useRouter } from "@webiny/react-router";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { Editor as PbEditor } from "../../../editor";
import { useSavedElements } from "../../hooks/useSavedElements";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { Typography } from "@webiny/ui/Typography";
import { LoadingEditor, LoadingTitle } from "./EditorStyled.js";
import { GET_PAGE, CREATE_PAGE_FROM } from "./graphql";
import {
    PageBuilderGetPageDataResponse,
    PageBuilderGetPageResponse,
    PbError,
    PbPageData
} from "~/types";

const extractPageGetPage = (data: PageBuilderGetPageResponse): PageBuilderGetPageDataResponse => {
    return data.pageBuilder?.getPage || {};
};

const extractPageData = (data: PageBuilderGetPageResponse): PbPageData => {
    const getPageData = extractPageGetPage(data);
    return getPageData.data;
};

const extractPageErrorData = (data: PageBuilderGetPageResponse): PbError | null => {
    const getPageData = extractPageGetPage(data);
    return getPageData.error || null;
};

const Editor: React.FC = () => {
    const { match, history } = useRouter();
    const { showSnackbar } = useSnackbar();
    const ready = useSavedElements();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

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

            const { revisions = [], content, ...restOfPageData } = data;
            const page = {
                ...restOfPageData,
                content: content || createElement("document")
            };

            return <PbEditor page={page} revisions={revisions} />;
        },
        [ready]
    );

    const [createPageFrom] = useMutation(CREATE_PAGE_FROM);

    useQuery(GET_PAGE, {
        variables: { id: decodeURIComponent(params.id) },
        fetchPolicy: "network-only",
        onCompleted: async data => {
            const errorData = extractPageErrorData(data);
            if (errorData) {
                setLoading(false);
                history.push(`/page-builder/pages`);
                showSnackbar(errorData.message);
                return;
            }

            const page = extractPageData(data);
            if (page.status === "draft") {
                setData(page);
            } else {
                const response = await createPageFrom({
                    variables: { from: page.id }
                });

                history.push(
                    `/page-builder/editor/${encodeURIComponent(
                        response.data.pageBuilder.createPage.data.id
                    )}`
                );
                setTimeout(() => showSnackbar("New revision created."), 1500);
            }
            setLoading(false);
        }
    });

    return renderEditor({ loading, data });
};

export default Editor;
