import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Checkbox, Drawer, EmptyState, IconButton, Tabs, Tag } from "@webiny/admin-ui";
import { ReactComponent as DoneAllIcon } from "@webiny/icons/done_all.svg";
import { ReactComponent as InboxIcon } from "@webiny/icons/inbox.svg";
import type { NotificationsPresenter, NotificationsTab } from "../abstractions.js";
import { groupByTime } from "../styles.js";
import { NotificationItem } from "./NotificationItem.js";
import { NotificationsSkeleton } from "./NotificationsSkeleton.js";
import "../styles.js";

interface Props {
    presenter: NotificationsPresenter.Interface;
}

export const NotificationsPanel = createReactiveComponent(({ presenter }: Props) => {
    const { vm } = presenter;
    const groups = groupByTime(vm.items);
    const isEmpty = !vm.loading && !vm.error && vm.items.length === 0;

    // Both tabs show the same list, filtered by the presenter. Tab contents are force-mounted,
    // so only the active tab renders it.
    const list = vm.loading ? (
        <NotificationsSkeleton />
    ) : (
        <>
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
        </>
    );

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
            bodyPadding={false}
            headerSeparator={false}
            icon={<Drawer.Icon icon={<InboxIcon />} label={"Inbox"} />}
            title={
                <>
                    Inbox
                    {vm.counts.unread > 0 ? (
                        <Tag variant={"accent-light"} content={`${vm.counts.unread} new`} />
                    ) : null}
                </>
            }
            headerActions={
                <IconButton
                    variant="ghost"
                    size="md"
                    iconSize="lg"
                    title="Mark all as read"
                    aria-label="Mark all as read"
                    disabled={vm.counts.unread === 0}
                    onClick={() => presenter.markAllRead()}
                    icon={<DoneAllIcon />}
                />
            }
        >
            <Tabs
                value={vm.tab}
                onValueChange={value => presenter.setTab(value as NotificationsTab)}
                separator={true}
                spacing={"lg"}
                // Keep the tab row in place and scroll only the list.
                className={"flex flex-col h-full"}
                actions={
                    <Checkbox
                        label="Unread only"
                        checked={vm.unreadOnly}
                        onChange={checked => presenter.setUnreadOnly(checked)}
                    />
                }
                tabs={[
                    <Tabs.Tab
                        key="inbox"
                        value="inbox"
                        trigger={vm.counts.inbox ? `Inbox (${vm.counts.inbox})` : "Inbox"}
                        content={vm.tab === "inbox" ? list : null}
                        className={"p-0 flex-1 min-h-0 overflow-y-auto"}
                    />,
                    <Tabs.Tab
                        key="archive"
                        value="archive"
                        trigger={vm.counts.archive ? `Archive (${vm.counts.archive})` : "Archive"}
                        content={vm.tab === "archive" ? list : null}
                        className={"p-0 flex-1 min-h-0 overflow-y-auto"}
                    />
                ]}
            />
        </Drawer>
    );
});
