import React, { useEffect, useMemo } from "react";
import { addMinutes, format } from "date-fns";
import { Grid, Drawer, CodeEditor, Tooltip, Tabs } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { Action } from "~/views/Logs/Table/index.js";
import { Text } from "~/components/Text.js";
import { useAuditLogsListConfig } from "~/config/list/AuditLogsListConfig.js";
import { useAuditLogDetailsPresenter } from "./feature.js";
import type { IAuditLog } from "~/types.js";

interface PreviewProps {
    auditLog: IAuditLog | null;
    onClose: () => void;
    hasAccessToUsers: boolean;
}

const EDITOR_HEIGHT = "calc(100vh - 350px)";

const PayloadTab = createReactiveComponent(function PayloadTab() {
    const presenter = useAuditLogDetailsPresenter();
    const { auditLog } = presenter.vm;
    if (!auditLog) {
        return null;
    }
    return (
        <CodeEditor
            language="json"
            value={JSON.stringify(JSON.parse(auditLog.content), null, 2)}
            height={EDITOR_HEIGHT}
        />
    );
});

export const Preview = createReactiveComponent(function Preview({
    auditLog,
    onClose,
    hasAccessToUsers
}: PreviewProps) {
    const presenter = useAuditLogDetailsPresenter();
    const config = useAuditLogsListConfig();

    useEffect(() => {
        if (auditLog) {
            presenter.init(auditLog);
        }
    }, [presenter, auditLog]);

    const tabs = useMemo(() => {
        if (!auditLog) {
            return [];
        }

        const customTabs = config.details.tabs.filter(
            tab => !tab.canRender || tab.canRender(auditLog)
        );

        return [
            <Tabs.Tab key="payload" value="payload" trigger="Payload" content={<PayloadTab />} />,
            ...customTabs.map(tab => (
                <Tabs.Tab
                    key={tab.name}
                    value={tab.name}
                    trigger={tab.label}
                    content={tab.element}
                />
            ))
        ];
    }, [auditLog, config.details.tabs]);

    if (!auditLog) {
        return null;
    }

    const date = new Date(auditLog.createdOn);

    return (
        <Drawer
            open={true}
            onClose={onClose}
            modal={true}
            width={720}
            title={auditLog.message}
            headerSeparator={true}
            bodyPadding={false}
            actions={<Drawer.CancelButton text={"Close"} onClick={onClose} />}
        >
            <div className={"flex flex-col h-full"}>
                <div className={"shrink-0 p-md pb-0"}>
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
                                side="left"
                                content={`UTC: ${format(
                                    addMinutes(date, date.getTimezoneOffset()),
                                    "yyyy-MM-dd HH:mm:ss"
                                )}`}
                                trigger={
                                    <Text use={"subtitle2"}>
                                        {format(date, "yyyy-MM-dd HH:mm:ss (O)")}
                                    </Text>
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
                        {hasAccessToUsers ? (
                            <Grid.Column span={6}>
                                <Text use="overline">Initiator</Text>
                                <br />
                                <a
                                    href={`/admin-users?id=${auditLog.createdBy.id}`}
                                    target={"blank"}
                                >
                                    <Text use={"subtitle2"}>{auditLog.createdBy.displayName}</Text>
                                </a>
                                <Text use={"body2"}>{` (${auditLog.createdBy.role})`}</Text>
                            </Grid.Column>
                        ) : null}
                    </Grid>
                </div>
                <div className={"px-md pb-md"}>
                    <Tabs tabs={tabs} />
                </div>
            </div>
        </Drawer>
    );
});
