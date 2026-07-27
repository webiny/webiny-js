import React from "react";
import { observer } from "mobx-react-lite";
import { useSecurity } from "@webiny/app-admin";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { CommentsPresenter } from "../abstractions.js";
import { avatarColor, initials } from "../styles.js";
import { MentionTextarea } from "./MentionTextarea.js";

interface Props {
    presenter: CommentsPresenter.Interface;
    activeLocator: string | null;
    resolveLabel: (locator: string) => string;
}

export const Composer = observer((props: Props) => {
    const { presenter, activeLocator, resolveLabel } = props;
    const { identity } = useSecurity();
    const authorName = identity?.displayName || "You";
    const { body, submitting } = presenter.vm.composer;

    return (
        <div className="wby-collab-composer">
            {activeLocator ? (
                <span
                    className="wby-collab-chip wby-collab-chip--active"
                    style={{ alignSelf: "flex-start" }}
                >
                    <span className="wby-collab-dot" />
                    <span className="wby-collab-chip__label">{resolveLabel(activeLocator)}</span>
                    <button
                        className="wby-collab-chip__x"
                        title="Comment on the whole entry instead"
                        onClick={() => presenter.setActiveLocator(null)}
                    >
                        <CloseIcon />
                    </button>
                </span>
            ) : (
                <span
                    className="wby-collab-chip wby-collab-chip--entry"
                    style={{ alignSelf: "flex-start" }}
                >
                    Whole entry
                </span>
            )}

            <div className="wby-collab-composer__box">
                <div className="wby-collab-composer__row">
                    <span
                        className="wby-collab-avatar"
                        style={{ background: avatarColor(authorName) }}
                    >
                        {initials(authorName)}
                    </span>
                    <MentionTextarea
                        className="wby-collab-textarea"
                        value={body}
                        placeholder="Add a comment…"
                        autoFocus={!!activeLocator}
                        maxHeight={240}
                        users={presenter.vm.mentionableUsers}
                        excludeUserId={identity?.id}
                        onChange={value => presenter.setComposerBody(value)}
                        onMention={userId => presenter.addComposerMention(userId)}
                        onKeyDown={event => {
                            event.stopPropagation();
                            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                void presenter.submitComposer();
                            }
                        }}
                    />
                </div>
                <div className="wby-collab-composer__actions">
                    <button
                        className="wby-collab-btn wby-collab-btn--ghost"
                        onClick={() => presenter.resetComposer()}
                        disabled={submitting || !body}
                    >
                        Cancel
                    </button>
                    <button
                        className="wby-collab-btn wby-collab-btn--primary"
                        onClick={() => void presenter.submitComposer()}
                        disabled={submitting || !body.trim()}
                    >
                        Comment
                    </button>
                </div>
            </div>
        </div>
    );
});
