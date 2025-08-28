import React from "react";
import { addMinutes, format } from "date-fns";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Dialog, DialogActions, DialogCancel, DialogContent, DialogTitle } from "@webiny/ui/Dialog";
import { CodeEditor } from "@webiny/ui/CodeEditor";
import { Tooltip } from "@webiny/ui/Tooltip";
import { Action } from "~/views/Logs/Table";
import { Text } from "~/components/Text";
import { PayloadWrapper, previewDialog } from "./styled";
import type { IAuditLog } from "~/types.js";

interface HeaderProps {
    auditLog: IAuditLog | null;
    onClose: () => void;
    hasAccessToUsers: boolean;
}

export const Preview = ({ auditLog, onClose, hasAccessToUsers }: HeaderProps) => {
    if (!auditLog) {
        return null;
    }
    const date = new Date(auditLog.createdOn);

    return (
        <Dialog open={!!auditLog} onClose={onClose} className={previewDialog} size={"xl"}>
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
                            <a href={`/admin-users?id=${auditLog.createdBy.id}`} target={"blank"}>
                                <Text use={"subtitle2"}>{auditLog.createdBy.displayName}</Text>
                            </a>
                            <Text use={"body2"}>{` (${auditLog.createdBy.role})`}</Text>
                        </Cell>
                    )}
                    <Cell span={12}>
                        <Text use="overline">Payload</Text>
                        <PayloadWrapper>
                            <CodeEditor
                                mode="json"
                                theme="chrome"
                                value={JSON.stringify(JSON.parse(auditLog.content), null, 2)}
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
