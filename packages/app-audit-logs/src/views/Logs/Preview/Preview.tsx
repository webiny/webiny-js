import React, { useEffect, useState } from "react";
import { addMinutes, format } from "date-fns";

import { Cell, Grid } from "@webiny/ui/Grid";
import { Dialog, DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { CodeEditor } from "@webiny/ui/CodeEditor";
import { Tooltip } from "@webiny/ui/Tooltip";

import { Action } from "~/views/Logs/Table";
import { Text } from "~/components/Text";
import { Entry } from "~/utils/transformCmsContentEntriesToRecordEntries";
import { PayloadWrapper, previewDialog } from "./styled";
import { useRecords } from "@webiny/app-aco";

type HeaderProps = {
    auditLog: Entry | null;
    onClose: () => void;
    hasAccessToUsers: boolean;
};

export const Preview = ({ auditLog, onClose, hasAccessToUsers }: HeaderProps) => {
    const { getRecord } = useRecords();

    const [auditLogData, setAuditLogData] = useState(null);

    useEffect(() => {
        if (auditLogData || !auditLog?.id) {
            return;
        }
        getRecord(auditLog.id).then(data => {
            setAuditLogData(data as any);
        });
    }, [auditLog?.id, auditLogData, setAuditLogData]);

    if (!auditLog || !auditLogData) {
        return null;
    }

    const date = new Date(auditLog.savedOn);

    return (
        <Dialog open={!!auditLog} onClose={onClose} className={previewDialog}>
            <DialogTitle>
                {auditLog.message}
                <div className="title-actions" tabIndex={0}></div>
            </DialogTitle>

            <DialogContent>
                <Grid>
                    <Cell span={6}>
                        <Text use="overline">Application</Text>
                        <br />
                        <Text use="subtitle2">{auditLog.app}</Text>
                    </Cell>
                    <Cell span={6}>
                        <Text use="overline">Date</Text>
                        <br />
                        <Tooltip
                            placement="right"
                            content={`UTC: ${format(
                                addMinutes(date, date.getTimezoneOffset()),
                                "yyyy-MM-dd HH:mm:ss"
                            )}`}
                        >
                            <Text use={"subtitle2"}>{format(date, "yyyy-MM-dd HH:mm:ss (O)")}</Text>
                        </Tooltip>
                    </Cell>
                    <Cell span={6}>
                        <Text use="overline">Entity</Text>
                        <br />
                        <Text use="subtitle2">{auditLog.entity.label}</Text>
                    </Cell>
                    <Cell span={6}>
                        <Text use="overline">Entity Id</Text>
                        <br />
                        {auditLog.entity.link ? (
                            <a href={auditLog.entity.link} target={"blank"}>
                                <Text use="subtitle2">{auditLog.entityId}</Text>
                            </a>
                        ) : (
                            <Text use="subtitle2">{auditLog.entityId}</Text>
                        )}
                    </Cell>
                    <Cell span={6}>
                        <Text use="overline">Action</Text>
                        <br />
                        <Action label={auditLog.action.label} value={auditLog.action.value} />
                    </Cell>
                    {hasAccessToUsers && (
                        <Cell span={6}>
                            <Text use="overline">Initiator</Text>
                            <br />
                            <a href={`/admin-users?id=${auditLog.initiator.id}`} target={"blank"}>
                                <Text use={"subtitle2"}>{auditLog.initiator.name}</Text>
                            </a>
                            <Text use={"body2"}>{` (${auditLog.initiator.role})`}</Text>
                        </Cell>
                    )}
                    <Cell span={12}>
                        <Text use="overline">Payload</Text>
                        <PayloadWrapper>
                            <CodeEditor
                                mode="json"
                                theme="chrome"
                                value={JSON.stringify(auditLogData, null, 2)}
                                readOnly
                            />
                        </PayloadWrapper>
                    </Cell>
                </Grid>
            </DialogContent>
            <DialogActions>
                <DialogCancel onClick={onClose}>Close</DialogCancel>
            </DialogActions>
        </Dialog>
    );
};
