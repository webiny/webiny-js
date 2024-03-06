import React from "react";
import get from "lodash/get";
import { useQuery } from "@apollo/react-hooks";
import { useRouter } from "@webiny/react-router";
import styled from "@emotion/styled";
import { renderPlugins } from "@webiny/app/plugins";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import {
    GET_PAGE,
    GetPageQueryResponse,
    GetPageQueryVariables,
    PageResponseData
} from "../../graphql/pages";
import { ButtonDefault, ButtonIcon } from "@webiny/ui/Button";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as AddIcon } from "@webiny/app-admin/assets/icons/add-18px.svg";
import { createUsePageHook, PageProvider } from "~/admin/contexts/Page";
import { ROOT_FOLDER } from "~/admin/constants";
import { PbPageData } from "~/types";

const t = i18n.ns("app-page-builder/admin/views/pages/page-details");

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "test-id": {
                children?: React.ReactNode;
            };
        }
    }
}

const DetailsContainer = styled("div")`
    height: 100%;
    overflow: hidden;
    position: relative;

    nav {
        background: var(--mdc-theme-surface);
    }
`;

interface EmptyPageDetailsProps {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
}

const EmptyPageDetails = ({ onCreatePage, canCreate }: EmptyPageDetailsProps) => {
    return (
        <EmptyView
            title={t`Click on the left side list to display page details {message} `({
                message: canCreate ? "or create a..." : ""
            })}
            action={
                canCreate ? (
                    <ButtonDefault data-testid="new-record-button" onClick={onCreatePage}>
                        <ButtonIcon icon={<AddIcon />} /> {t`New Page`}
                    </ButtonDefault>
                ) : (
                    <></>
                )
            }
        />
    );
};

function isValidPageData(data: PageResponseData | unknown): data is PageResponseData {
    return data !== null;
}

interface PageDetailsProps {
    onCreatePage: (event?: React.SyntheticEvent) => void;
    canCreate: boolean;
    onDelete: () => void;
}

export const PageDetails = ({ onCreatePage, canCreate, onDelete }: PageDetailsProps) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();

    const query = new URLSearchParams(location.search);
    const pageId = query.get("id");

    const getPageQuery = useQuery<GetPageQueryResponse, GetPageQueryVariables>(GET_PAGE, {
        variables: { id: String(pageId) },
        skip: !pageId,
        onCompleted: data => {
            const error = data?.pageBuilder?.getPage?.error;
            if (error) {
                history.push("/page-builder/pages");
                showSnackbar(error.message);
            }
        }
    });

    const pageData = get(getPageQuery, "data.pageBuilder.getPage.data", {});
    const folderId = get(pageData, "wbyAco_location.folderId") ?? ROOT_FOLDER;

    const page = {
        ...pageData,
        wbyAco_location: {
            folderId
        }
    };

    if (!pageId || !isValidPageData(page)) {
        return <EmptyPageDetails canCreate={canCreate} onCreatePage={onCreatePage} />;
    }

    return (
        <DetailsContainer>
            <PageProvider<PageResponseData> page={page}>
                <test-id data-testid="pb-page-details">
                    {renderPlugins("pb-page-details", {
                        page,
                        getPageQuery,
                        onDelete
                    })}
                </test-id>
            </PageProvider>
        </DetailsContainer>
    );
};

export const usePage = createUsePageHook<PbPageData>();
