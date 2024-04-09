import React from "react";
import { Typography } from "@webiny/ui/Typography";
import { i18n } from "@webiny/app/i18n";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import { Link } from "@webiny/react-router";
import { ShowDetails } from "../styledComponents";
import { ListImportedPagesResponse } from "~/admin/graphql/pageImportExport.gql";

const t = i18n.ns("app-page-builder/editor/plugins/defaultBar/importPage");

interface ImportPagesDetailsProps {
    loading: boolean;
    result?: ListImportedPagesResponse;
}

const ImportPagesDetails = ({ loading, result }: ImportPagesDetailsProps) => {
    if (loading || !result) {
        return <Typography use={"caption"}> {t`Loading details...`} </Typography>;
    }

    const { data: pages, error } = result.pageBuilder.listImportedPages;
    if (error) {
        return <ShowDetails.Container>{error.message}</ShowDetails.Container>;
    } else if (!pages?.length) {
        return (
            <ShowDetails.Container>
                {t`Something is wrong, cannot find imported pages.`}
            </ShowDetails.Container>
        );
    }
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
                        {pages.map(page => {
                            return (
                                <ShowDetails.ListItem key={page.id}>
                                    <Typography use={"body2"}>
                                        {`${page.title} (v${page.version})`}
                                    </Typography>
                                    <Link
                                        to={`/page-builder/editor/${encodeURIComponent(page.id)}`}
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
