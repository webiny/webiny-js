// @flow
import React, { useState } from "react";
import TimeAgo from "timeago-react";
import { css } from "emotion";
import { Typography } from "webiny-ui/Typography";
import { Checkbox } from "webiny-ui/Checkbox";
import Block from "../Block";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListTextOverline,
    ListItemMeta,
    ListSelectBox
} from "webiny-ui/List";
import FormSubmissionDialog from "./FormSubmissionDialog";
import { ReactComponent as ImportExport } from "./icons/round-cloud_download-24px.svg";
import { IconButton } from "webiny-ui/Button";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.FormsDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

const FormsSubmissionsList = (props: Object) => {
    const { dataList, form } = props;
    const [selectedFormSubmission, selectFormSubmission] = useState(null);

    return (
        <>
            <Block title="Submissions">
                <DataList
                    {...dataList}
                    multiSelectAll={dataList.multiSelectAll}
                    multiSelect={dataList.multiSelect}
                    multiSelectActions={
                        <IconButton
                            onClick={() => {
                                //console.log("Multi selected items: ", dataList.getMultiSelected());
                            }}
                            icon={<ImportExport />}
                        />
                    }
                    sorters={[
                        {
                            label: t`Newest to oldest`,
                            sorters: { "meta.submittedOn": -1 }
                        },
                        {
                            label: t`Oldest to newest`,
                            sorters: { "meta.submittedOn": 1 }
                        }
                    ]}
                >
                    {({ data = [] }) => (
                        <List>
                            {data.map(submission => (
                                <ListItem key={submission.id}>
                                    <ListSelectBox>
                                        <Checkbox
                                            onChange={() => dataList.multiSelect(submission)}
                                            value={dataList.isMultiSelected(submission)}
                                        />
                                    </ListSelectBox>
                                    <ListItemText onClick={() => selectFormSubmission(submission)}>
                                        {submission.data.firstName && submission.data.firstName}
                                        {submission.data.lastName && " " + submission.data.lastName}
                                        {submission.data.email &&
                                            " <" + submission.data.email + ">"}
                                        <ListTextOverline>
                                            {submission.meta.ip || "N/A"}
                                        </ListTextOverline>
                                    </ListItemText>
                                    <ListItemMeta className={rightAlign}>
                                        <Typography use={"subtitle2"}>
                                            {t`Submitted: {time}.`({
                                                time: (
                                                    <TimeAgo
                                                        datetime={submission.meta.submittedOn}
                                                    />
                                                )
                                            })}
                                        </Typography>
                                    </ListItemMeta>
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DataList>
            </Block>
            <FormSubmissionDialog
                form={form}
                onClose={() => selectFormSubmission(null)}
                formSubmission={selectedFormSubmission}
            />
        </>
    );
};

export default FormsSubmissionsList;
