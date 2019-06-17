// @flow
import React, { useState } from "react";
import TimeAgo from "timeago-react";
import { css } from "emotion";
import { Typography } from "webiny-ui/Typography";
import {
    DataList,
    List,
    ListItem,
    ListItemText,
    ListTextOverline,
    ListItemMeta
} from "webiny-ui/List";
import FormSubmissionDialog from "./FormSubmissionDialog";

import { i18n } from "webiny-app/i18n";
const t = i18n.namespace("FormsApp.FormsDataList");

const rightAlign = css({
    alignItems: "flex-end !important"
});

const FormsSubmissionsList = (props: Object) => {
    const { dataList } = props;
    const [selectedFormSubmission, selectFormSubmission] = useState(null);

    return (
        <>
            <DataList
                {...dataList}
                title={t`Forms`}
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
                                <ListItemText onClick={() => selectFormSubmission(submission)}>
                                    Sta cemo tu ispisati? 😁
                                    <ListTextOverline>
                                        {submission.meta.ip || "N/A"}
                                    </ListTextOverline>
                                </ListItemText>
                                <ListItemMeta className={rightAlign}>
                                    <Typography use={"subtitle2"}>
                                        {t`Submitted: {time}.`({
                                            time: <TimeAgo datetime={submission.meta.submittedOn} />
                                        })}
                                    </Typography>
                                </ListItemMeta>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DataList>
            <FormSubmissionDialog
                onClose={() => selectFormSubmission(null)}
                formSubmission={selectedFormSubmission}
            />
        </>
    );
};

export default FormsSubmissionsList;
