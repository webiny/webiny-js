import React from "react";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { ShowDetails } from "../styledComponents";
import { ListBlockImportExportSubTasksResponse } from "~/admin/graphql/blockImportExport.gql";
import { PageBuilderImportExportSubTask } from "~/types";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importBlock");

interface ImportBlocksDetailsProps {
    loading: boolean;
    result: ListBlockImportExportSubTasksResponse;
}

const ImportBlocksDetails = ({ loading, result }: ImportBlocksDetailsProps) => {
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
                    <ShowDetails.Label use={"body2"}>{t`Blocks imported:`}</ShowDetails.Label>
                    <ShowDetails.List data-testid={"import-blocks-dialog.show-detail-list"}>
                        {subtasks.map(subtask => {
                            const { block } = subtask.data;
                            return (
                                <ShowDetails.ListItem key={block.id}>
                                    <Typography use={"body2"}>{block.name}</Typography>
                                </ShowDetails.ListItem>
                            );
                        })}
                    </ShowDetails.List>
                </Scrollbar>
            </ShowDetails.Accordion>
        </ShowDetails.Container>
    );
};

export default ImportBlocksDetails;
