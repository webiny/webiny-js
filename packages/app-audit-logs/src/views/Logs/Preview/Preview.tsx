import React from "react";
import { addMinutes, format } from "date-fns";
import { Grid, Dialog, CodeEditor, Tooltip } from "@webiny/admin-ui";
import { Action } from "~/views/Logs/Table/index.js";
import { Text } from "~/components/Text.js";
import { PayloadWrapper, previewDialog } from "./styled.js";
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
        <Dialog
            open={!!auditLog}
            onClose={onClose}
            className={previewDialog}
            size={"xl"}
            title={auditLog.message}
            actions={<Dialog.CancelAction onClick={onClose} text={"Close"} />}
        >
            <Grid>
                <Grid.Column span={6}>
                    <Text use="overline">Application</Text>
                    <br />
                    <Text use="subtitle2">{auditLog.app}</Text>
                </Grid.Column>
                <Grid.Column span={6}>
                    <Text use="overline">Date</Text>
                    <br />
                    <Tooltip
                        side="right"
                        content={`UTC: ${format(
                            addMinutes(date, date.getTimezoneOffset()),
                            "yyyy-MM-dd HH:mm:ss"
                        )}`}
                        trigger={
                            <Text use={"subtitle2"}>{format(date, "yyyy-MM-dd HH:mm:ss (O)")}</Text>
                        }
                    />
                </Grid.Column>
                <Grid.Column span={6}>
                    <Text use="overline">Entity</Text>
                    <br />
                    <Text use="subtitle2">{auditLog.entity.label}</Text>
                </Grid.Column>
                <Grid.Column span={6}>
                    <Text use="overline">Entity Id</Text>
                    <br />
                    {auditLog.entity.link ? (
                        <a href={auditLog.entity.link} target={"blank"}>
                            <Text use="subtitle2">{auditLog.entityId}</Text>
                        </a>
                    ) : (
                        <Text use="subtitle2">{auditLog.entityId}</Text>
                    )}
                </Grid.Column>
                <Grid.Column span={6}>
                    <Text use="overline">Action</Text>
                    <br />
                    <Action label={auditLog.action.label} value={auditLog.action.value} />
                </Grid.Column>
                {
                    (hasAccessToUsers ? (
                        <Grid.Column span={6}>
                            <Text use="overline">Initiator</Text>
                            <br />
                            <a href={`/admin-users?id=${auditLog.createdBy.id}`} target={"blank"}>
                                <Text use={"subtitle2"}>{auditLog.createdBy.displayName}</Text>
                            </a>
                            <Text use={"body2"}>{` (${auditLog.createdBy.role})`}</Text>
                        </Grid.Column>
                    ) : undefined) as any
                }
                <Grid.Column span={12}>
                    <Text use="overline">Payload</Text>
                    <PayloadWrapper>
                        <CodeEditor
                            language="json"
                            value={JSON.stringify(JSON.parse(auditLog.content), null, 2)}
                        />
                    </PayloadWrapper>
                </Grid.Column>
            </Grid>
        </Dialog>
    );
};
