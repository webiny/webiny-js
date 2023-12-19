import React from "react";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Link } from "@webiny/react-router";
import { ShowDetails } from "../styledComponents";
import { ListTemplateImportExportSubTasksResponse } from "~/admin/graphql/templateImportExport.gql";
import { PageBuilderImportExportSubTask } from "~/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importTemplate");

interface ImportTemplatesDetailsProps {
    loading: boolean;
    result: ListTemplateImportExportSubTasksResponse;
}

const ImportTemplatesDetails = ({ loading, result }: ImportTemplatesDetailsProps) => {
    if (loading || !result) {
        return <Typography use={"caption"}> {t`Loading details...`} </Typography>;
    }
    const subtasks: PageBuilderImportExportSubTask[] = get(
        result,
        "pageBuilder.listImportExportSubTask.data",
        []
    );
    return (
        <ShowDetails.Container>
            <ShowDetails.Accordion title={"Show details"}>
                <Scrollbar
                    style={{
                        height: 160
                    }}
                >
                    <ShowDetails.Label use={"body2"}>{t`Templates imported:`}</ShowDetails.Label>
                    <ShowDetails.List data-testid={"import-templates-dialog.show-detail-list"}>
                        {subtasks.map(subtask => {
                            const { template } = subtask.data;
                            return (
                                <ShowDetails.ListItem key={template.id}>
                                    <Typography use={"body2"}>{template.title}</Typography>
                                    <Link
                                        to={`/page-builder/page-templates?id=${encodeURIComponent(
                                            template.id
                                        )}`}
                                        target={"_blank"}
                                    >
                                        <ShowDetails.LinkText use={"body2"}>
                                            {t`view`}
                                        </ShowDetails.LinkText>
                                    </Link>
                                </ShowDetails.ListItem>
                            );
                        })}
                    </ShowDetails.List>
                </Scrollbar>
            </ShowDetails.Accordion>
        </ShowDetails.Container>
    );
};

export default ImportTemplatesDetails;
