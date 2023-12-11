import React from "react";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Link } from "@webiny/react-router";
import { ShowDetails } from "../styledComponents";
import { ListPageImportExportSubTasksResponse } from "~/admin/graphql/pageImportExport.gql";
import { PageBuilderImportExportSubTask } from "~/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

interface ImportPagesDetailsProps {
    loading: boolean;
    result: ListPageImportExportSubTasksResponse;
}

const ImportPagesDetails = ({ loading, result }: ImportPagesDetailsProps) => {
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
                    <ShowDetails.Label use={"body2"}>{t`Pages imported:`}</ShowDetails.Label>
                    <ShowDetails.List data-testid={"import-pages-dialog.show-detail-list"}>
                        {subtasks.map(subtask => {
                            const { page } = subtask.data;
                            return (
                                <ShowDetails.ListItem key={page.id}>
                                    <Typography use={"body2"}>
                                        {`${page.title} (v${page.version})`}
                                    </Typography>
                                    <Link
                                        to={`/page-builder/pages?id=${encodeURIComponent(page.id)}`}
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

export default ImportPagesDetails;
