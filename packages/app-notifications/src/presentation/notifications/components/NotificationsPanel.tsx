import React from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as DoneAllIcon } from "@webiny/icons/done_all.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { ReactComponent as InboxIcon } from "@webiny/icons/inbox.svg";
import type { NotificationsPresenter } from "../abstractions.js";
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
        <>
            <div className="wby-notif-scrim" onClick={() => presenter.closePanel()} />
            <aside className="wby-notif-panel">
                <div className="wby-notif-header">
                    <div className="wby-notif-title">
                        <InboxIcon className="wby-notif-title__icon" />
                        Inbox
                        {vm.counts.unread > 0 ? (
                            <span className="wby-notif-newbadge">{vm.counts.unread} new</span>
                        ) : null}
                    </div>
                    <div className="wby-notif-actions">
                        <button
                            className="wby-notif-iconbtn wby-notif-iconbtn--primary"
                            title="Mark all as read"
                            disabled={vm.counts.unread === 0}
                            onClick={() => presenter.markAllRead()}
                        >
                            <DoneAllIcon />
                        </button>
                        <button
                            className="wby-notif-iconbtn"
                            title="Refresh"
                            disabled={vm.loading}
                            onClick={() => void presenter.refresh()}
                        >
                            <RefreshIcon className={vm.loading ? "wby-notif-spin" : undefined} />
                        </button>
                        <button
                            className="wby-notif-iconbtn"
                            title="Close"
                            onClick={() => presenter.closePanel()}
                        >
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <div className="wby-notif-tabs">
                    <button
                        className={vm.tab === "inbox" ? "wby-notif-tab is-active" : "wby-notif-tab"}
                        onClick={() => presenter.setTab("inbox")}
                    >
                        Inbox <span className="wby-notif-tab__count">{vm.counts.inbox}</span>
                    </button>
                    <button
                        className={
                            vm.tab === "archive" ? "wby-notif-tab is-active" : "wby-notif-tab"
                        }
                        onClick={() => presenter.setTab("archive")}
                    >
                        Archive <span className="wby-notif-tab__count">{vm.counts.archive}</span>
                    </button>
                    <label className="wby-notif-unreadonly">
                        <input
                            type="checkbox"
                            checked={vm.unreadOnly}
                            onChange={event => presenter.setUnreadOnly(event.target.checked)}
                        />
                        Unread only
                    </label>
                </div>

                <div className="wby-notif-list">
                    {vm.error ? <div className="wby-notif-empty">{vm.error}</div> : null}
                    {isEmpty ? (
                        <div className="wby-notif-empty">{"You're all caught up."}</div>
                    ) : null}
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
            </aside>
        </>
    );
});
