import React, { useState } from "react";
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
    const [body, setBody] = useState("");
    const [mentions, setMentions] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const addMention = (userId: string) => {
        setMentions(current => (current.includes(userId) ? current : [...current, userId]));
    };

    const submit = async () => {
        if (!body.trim() || busy) {
            return;
        }
        setBusy(true);
        try {
            // Empty locator => entry-level (unanchored) comment.
            await presenter.createThread({ locator: activeLocator ?? "", body, mentions });
            setBody("");
            setMentions([]);
        } finally {
            setBusy(false);
        }
    };

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
                        onChange={setBody}
                        onMention={addMention}
                        onKeyDown={event => {
                            event.stopPropagation();
                            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                                void submit();
                            }
                        }}
                    />
                </div>
                <div className="wby-collab-composer__actions">
                    <button
                        className="wby-collab-btn wby-collab-btn--ghost"
                        onClick={() => {
                            setBody("");
                            setMentions([]);
                        }}
                        disabled={busy || !body}
                    >
                        Cancel
                    </button>
                    <button
                        className="wby-collab-btn wby-collab-btn--primary"
                        onClick={submit}
                        disabled={busy || !body.trim()}
                    >
                        Comment
                    </button>
                </div>
            </div>
        </div>
    );
});
