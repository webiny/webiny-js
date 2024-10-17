import React from "react";
import styled from "@emotion/styled";
import { useQuery } from "@apollo/react-hooks";

import { useRouter } from "@webiny/react-router";
import { useSnackbar } from "@webiny/app-admin/hooks/useSnackbar";
import { ButtonDefault, ButtonIcon, IconButton } from "@webiny/ui/Button";
import { Elevation } from "@webiny/ui/Elevation";
import { CircularProgress } from "@webiny/ui/Progress";
import { Typography } from "@webiny/ui/Typography";
import EmptyView from "@webiny/app-admin/components/EmptyView";
import { i18n } from "@webiny/app/i18n";
import { ReactComponent as AddIcon } from "@material-design-icons/svg/filled/add.svg";
import { ReactComponent as EditIcon } from "@material-design-icons/svg/round/edit.svg";
import { ReactComponent as DeleteIcon } from "@material-design-icons/svg/round/delete.svg";

import { GET_PAGE_TEMPLATE } from "./graphql";
import { CreatableItem } from "./PageTemplates";
import { PagePreview } from "~/admin/plugins/pageDetails/previewContent/PagePreview";
import { PbPageTemplate } from "~/types";

const t = i18n.ns("app-page-builder/admin/views/page-templates/page-template-details");

const DetailsContainer = styled.div`
    height: calc(100% - 10px);
    overflow: hidden;
    position: relative;

    .mdc-tab-bar {
        background-color: var(--mdc-theme-surface);
    }
`;

const RenderBlock = styled.div`
    position: relative;
    z-index: 0;
    background-color: var(--mdc-theme-background);
    height: 100%;
    overflow: auto;
    padding: 25px;
`;

const HeaderTitle = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--mdc-theme-on-background);
    color: var(--mdc-theme-text-primary-on-background);
    background: var(--mdc-theme-surface);
    padding-top: 10px;
    padding-bottom: 9px;
    padding-left: 24px;
    padding-right: 24px;
`;

const PageTemplateTitle = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

const HeaderActions = styled.div`
    justify-content: flex-end;
    margin-right: -15px;
    margin-left: 10px;
    display: flex;
    align-items: center;
`;

interface EmptyTemplateDetailsProps {
    onCreate: () => void;
    canCreate: boolean;
}

const EmptyTemplateDetails = ({ onCreate, canCreate }: EmptyTemplateDetailsProps) => {
    return (
        <EmptyView
            title={t`Click on the left side list to display page details {message} `({
                message: canCreate ? "or create a..." : ""
            })}
            action={
                canCreate ? (
                    <ButtonDefault
                        data-testid="pb-templates-form-new-template-btn"
                        onClick={onCreate}
                    >
                        <ButtonIcon icon={<AddIcon />} /> {t`New Template`}
                    </ButtonDefault>
                ) : (
                    <></>
                )
            }
        />
    );
};

type PageBuilderPageTemplateDetailsProps = {
    canCreate: boolean;
    canEdit: (item: CreatableItem) => boolean;
    canDelete: (item: CreatableItem) => boolean;
    onCreate: () => void;
    onDelete: (item: PbPageTemplate) => void;
};

const PageTemplatesDetails = ({
    canCreate,
    canEdit,
    canDelete,
    onCreate,
    onDelete
}: PageBuilderPageTemplateDetailsProps) => {
    const { history, location } = useRouter();
    const { showSnackbar } = useSnackbar();

    const query = new URLSearchParams(location.search);
    const templateId = query.get("id");

    const getPageTemplateQuery = useQuery(GET_PAGE_TEMPLATE, {
        variables: { id: templateId },
        skip: !templateId,
        onCompleted: data => {
            const error = data?.pageBuilder?.getPageTemplate?.error;
            if (error) {
                history.push("/page-builder/page-templates");
                showSnackbar(error.message);
            }
        }
    });

    if (!templateId) {
        return <EmptyTemplateDetails canCreate={canCreate} onCreate={onCreate} />;
    }

    const template = getPageTemplateQuery.data?.pageBuilder?.getPageTemplate?.data || {};

    return (
        <DetailsContainer>
            <RenderBlock>
                <Elevation z={2}>
                    <div style={{ position: "relative" }} data-testid={"pb-page-templates-form"}>
                        {getPageTemplateQuery.loading && <CircularProgress />}
                        <HeaderTitle>
                            <PageTemplateTitle>
                                <Typography use="headline5">{template.title}</Typography>
                            </PageTemplateTitle>
                            <HeaderActions>
                                {canEdit(template) && (
                                    <IconButton
                                        icon={<EditIcon />}
                                        onClick={() =>
                                            history.push(
                                                `/page-builder/template-editor/${template.id}`
                                            )
                                        }
                                    />
                                )}
                                {canDelete(template) && (
                                    <IconButton
                                        icon={<DeleteIcon />}
                                        onClick={() => onDelete(template)}
                                    />
                                )}
                            </HeaderActions>
                        </HeaderTitle>
                        <PagePreview page={template} />
                    </div>
                </Elevation>
            </RenderBlock>
        </DetailsContainer>
    );
};

export default PageTemplatesDetails;
