import React, { FunctionComponent } from "react";
import get from "lodash/get";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Link } from "@webiny/react-router";
import { ShowDetails } from "./styledComponents";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

interface ImportPagesDetailsProps {
    loading: boolean;
    data: Record<string, any>;
}

const ImportPagesDetails: FunctionComponent<ImportPagesDetailsProps> = ({ loading, data }) => {
    return (
        <>
            {loading && <Typography use={"caption"}> {t`Loading details...`} </Typography>}

            {data && (
                <ShowDetails.Container>
                    <ShowDetails.Accordion title={"Show details"}>
                        <Scrollbar
                            style={{
                                height: 160
                            }}
                        >
                            <ShowDetails.Label use={"subtitle2"}>
                                {t`Pages imported:`}
                            </ShowDetails.Label>
                            <ShowDetails.List>
                                {get(
                                    data,
                                    "pageBuilder.getPageImportExportSubTaskByStatus.data",
                                    []
                                ).map(({ data }) => {
                                    const { page } = data;
                                    return (
                                        <ShowDetails.ListItem key={page.id}>
                                            <Typography use={"body2"}>
                                                {`${page.title} (v${page.version})`}
                                            </Typography>
                                            <Link
                                                to={`/page-builder/pages?id=${encodeURIComponent(
                                                    page.id
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
            )}
        </>
    );
};

export default ImportPagesDetails;
