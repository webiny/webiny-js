import React from "react";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Link } from "@webiny/react-router";
import { ShowDetails } from "./styledComponents";
import { ListFormImportExportSubTasksResponse } from "~/admin/graphql";
import { FormBuilderImportExportSubTask } from "~/types";

const t = i18n.ns("app-form-builder/admin/plugins/editor/defaultBar/importForm");

interface ImportFormsDetailsProps {
    loading: boolean;
    result: ListFormImportExportSubTasksResponse;
}

const ImportFormsDetails = ({ loading, result }: ImportFormsDetailsProps) => {
    if (loading || !result) {
        return <Typography use={"caption"}> {t`Loading details...`} </Typography>;
    }
    const subtasks: FormBuilderImportExportSubTask[] = get(
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
                    <ShowDetails.Label use={"body2"}>{t`Forms imported:`}</ShowDetails.Label>
                    <ShowDetails.List data-testid={"import-forms-dialog.show-detail-list"}>
                        {subtasks.map(subtask => {
                            const { form } = subtask.data;
                            return (
                                <ShowDetails.ListItem key={form.id}>
                                    <Typography use={"body2"}>
                                        {`${form.name} (v${form.version})`}
                                    </Typography>
                                    <Link
                                        to={`/form-builder/forms?id=${encodeURIComponent(form.id)}`}
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

export default ImportFormsDetails;
