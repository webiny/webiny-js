import React from "react";
import { observer } from "mobx-react-lite";
import { Checkbox, Drawer, EmptyState, IconButton, SegmentedControl } from "@webiny/admin-ui";
import { ReactComponent as DoneAllIcon } from "@webiny/icons/done_all.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as InboxIcon } from "@webiny/icons/inbox.svg";
import type { NotificationsPresenter, NotificationsTab } from "../abstractions.js";
import { groupByTime } from "../styles.js";
import { NotificationItem } from "./NotificationItem.js";
import "../styles.js";

interface Props {
    presenter: NotificationsPresenter.Interface;
}

export const NotificationsPanel = observer(({ presenter }: Props) => {
    const { vm } = presenter;
    const groups = groupByTime(vm.items);
    const isEmpty = !vm.loading && !vm.error && vm.items.length === 0;

    return (
        <Drawer
            open={vm.open}
            onOpenChange={open => {
                if (!open) {
                    presenter.closePanel();
                }
            }}
            modal
            width={440}
            showCloseButton={false}
            bodyPadding={false}
        >
            <div className="wby-notif-panel-inner">
                <div className="wby-notif-header">
                    <div className="wby-notif-title">
                        <InboxIcon className="wby-notif-title__icon" />
                        Inbox
                        {vm.counts.unread > 0 ? (
                            <span className="wby-notif-newbadge">{vm.counts.unread} new</span>
                        ) : null}
                    </div>
                    <div className="wby-notif-actions">
                        <IconButton
                            variant="ghost"
                            size="sm"
                            title="Mark all as read"
                            aria-label="Mark all as read"
                            disabled={vm.counts.unread === 0}
                            onClick={() => presenter.markAllRead()}
                            icon={<DoneAllIcon />}
                        />
                        <IconButton
                            variant="ghost"
                            size="sm"
                            title="Refresh"
                            aria-label="Refresh"
                            disabled={vm.loading}
                            onClick={() => void presenter.refresh()}
                            icon={
                                <RefreshIcon
                                    className={vm.loading ? "wby-notif-spin" : undefined}
                                />
                            }
                        />
                        <IconButton
                            variant="ghost"
                            size="sm"
                            title="Close"
                            aria-label="Close"
                            onClick={() => presenter.closePanel()}
                            icon={<CloseIcon />}
                        />
                    </div>
                </div>

                <div className="wby-notif-tabs">
                    <SegmentedControl
                        value={vm.tab}
                        onChange={value => presenter.setTab(value as NotificationsTab)}
                        items={[
                            {
                                value: "inbox",
                                label: vm.counts.inbox ? `Inbox (${vm.counts.inbox})` : "Inbox"
                            },
                            {
                                value: "archive",
                                label: vm.counts.archive
                                    ? `Archive (${vm.counts.archive})`
                                    : "Archive"
                            }
                        ]}
                    />
                    <div style={{ marginLeft: "auto" }}>
                        <Checkbox
                            label="Unread only"
                            checked={vm.unreadOnly}
                            onChange={checked => presenter.setUnreadOnly(checked)}
                        />
                    </div>
                </div>

                <div className="wby-notif-list">
                    {vm.error ? <div className="wby-notif-empty">{vm.error}</div> : null}
                    {isEmpty ? <EmptyState size="sm" description="You're all caught up." /> : null}
                    {groups.map(group => (
                        <div key={group.label}>
                            <div className="wby-notif-group__label">{group.label}</div>
                            {group.items.map(notification => (
                                <NotificationItem
                                    key={notification.id}
                                    presenter={presenter}
                                    notification={notification}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </Drawer>
    );
});
