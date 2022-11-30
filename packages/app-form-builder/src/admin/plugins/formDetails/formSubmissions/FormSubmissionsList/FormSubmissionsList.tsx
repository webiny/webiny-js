import React, { useState } from "react";
/**
 * Package timeago-react does not have types
 */
// @ts-ignore
import TimeAgo from "timeago-react";
import { css } from "emotion";
import { i18n } from "@webiny/app/i18n";
import * as ListComponents from "@webiny/ui/List";
import { Tooltip } from "@webiny/ui/Tooltip";
import { IconButton } from "@webiny/ui/Button";
import { Typography } from "@webiny/ui/Typography";
import { Scrollbar } from "@webiny/ui/Scrollbar";
import FormSubmissionDialog from "./FormSubmissionDialog";
import { ReactComponent as ImportExport } from "./icons/round-cloud_download-24px.svg";
import Block from "../Block";
import { useSubmissions } from "./useSubmissions";
import { FbFormSubmissionData } from "~/types";

const t = i18n.namespace("FormsApp.FormsDataList");

const TOP = 490;
const blockWrapper = css({
    "& .webiny-data-list__content": {
        height: `calc(100vh - ${TOP}px)`
    }
});
const rightAlign = css({
    alignItems: "flex-end !important"
});

interface FullNameProps {
    submission: FbFormSubmissionData;
}
const FullName: React.FC<FullNameProps> = ({ submission }) => {
    const {
        data: { firstName, lastName, email }
    } = submission;

    const output = [firstName, lastName, email && `<${email}>`].filter(Boolean).join(" ");
    return <span>{output || "N/A"}</span>;
};

interface FormVersionProps {
    submission: FbFormSubmissionData;
}
const FormVersion: React.FC<FormVersionProps> = ({ submission }) => {
    return <span>Form revision #{submission.form.version}</span>;
};

interface FormSubmissionsListProps {
    form: {
        id: string;
    };
}

const { DataList, ListItem, ListItemMeta, ListItemText, ListTextOverline } = ListComponents;

export const FormSubmissionsList: React.FC<FormSubmissionsListProps> = ({ form }) => {
    const {
        loading,
        refresh,
        submissions,
        setSorter,
        nextPage,
        previousPage,
        hasPreviousPage,
        hasNextPage,
        exportSubmissions,
        exportInProgress
    } = useSubmissions(form);

    const [selectedFormSubmission, selectFormSubmission] = useState<FbFormSubmissionData | null>(
        null
    );

    return (
        <>
            <Block title="Submissions" className={blockWrapper}>
                <DataList
                    loading={loading}
                    refresh={refresh}
                    data={submissions}
                    setSorters={setSorter}
                    pagination={{
                        hasNextPage,
                        hasPreviousPage,
                        setNextPage: nextPage,
                        setPreviousPage: previousPage
                    }}
                    multiSelectAll={undefined}
                    multiSelectActions={
                        <Tooltip content={t`Export all form submissions`} placement={"bottom"}>
                            <IconButton
                                icon={<ImportExport />}
                                onClick={exportSubmissions}
                                disabled={exportInProgress}
                            />
                        </Tooltip>
                    }
                    // sorters={sorters}
                    showOptions={{
                        multiSelectAll: false,
                        sorters: true,
                        refresh: true,
                        pagination: true
                    }}
                >
                    {({ data = [] }: { data: FbFormSubmissionData[] }) => (
                        <Scrollbar>
                            {data.map(submission => {
                                const submittedOn = submission.meta
                                    ? new Date(submission.meta.submittedOn)
                                    : new Date();

                                return (
                                    <ListItem key={submission.id}>
                                        <ListItemText
                                            onClick={() => selectFormSubmission(submission)}
                                        >
                                            <FullName submission={submission} />
                                            <ListTextOverline>
                                                Visitor IP:{" "}
                                                {(submission.meta && submission.meta.ip) || "N/A"}
                                            </ListTextOverline>
                                        </ListItemText>
                                        <ListItemMeta className={rightAlign}>
                                            <Typography use={"body2"}>
                                                {t`Submitted: {time}.`({
                                                    time: <TimeAgo datetime={submittedOn} />
                                                })}
                                                <br />
                                                <FormVersion submission={submission} />
                                            </Typography>
                                        </ListItemMeta>
                                    </ListItem>
                                );
                            })}
                        </Scrollbar>
                    )}
                </DataList>
            </Block>
            <FormSubmissionDialog
                onClose={() => {
                    selectFormSubmission(null);
                }}
                formSubmission={selectedFormSubmission}
            />
        </>
    );
};
