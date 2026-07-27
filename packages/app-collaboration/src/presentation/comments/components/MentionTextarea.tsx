import React, { useLayoutEffect, useRef, useState } from "react";
import { TextareaPrimitive } from "@webiny/admin-ui";
import { avatarColor, initials } from "../styles.js";
import type { CollabUser } from "~/types.js";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onMention?: (userId: string) => void;
    users: CollabUser[];
    /** User id to omit from suggestions (e.g. the current user). */
    excludeUserId?: string;
    placeholder?: string;
    className?: string;
    autoFocus?: boolean;
    maxHeight?: number;
    onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

// The active @token immediately before the caret (start of line or after whitespace).
const MENTION_RE = /(?:^|\s)@([\w.\-]*)$/;

/**
 * An auto-growing textarea with @mention autocomplete. Detects an `@query` before the caret,
 * shows a filtered user list, and on select inserts `@Display Name ` and reports the user id
 * (mentions are tracked by the parent — best-effort, not re-parsed from text).
 */
export const MentionTextarea = ({
    value,
    onChange,
    onMention,
    users,
    excludeUserId,
    placeholder,
    className,
    autoFocus,
    maxHeight = 220,
    onKeyDown
}: Props) => {
    const ref = useRef<HTMLTextAreaElement>(null);
    // When the user dismisses the menu with Esc, keep it closed until they type again
    // (otherwise the following keyup/click re-detects the same @token and reopens it).
    const dismissedRef = useRef(false);
    const [query, setQuery] = useState<string | null>(null);
    const [atIndex, setAtIndex] = useState(0);
    const [caret, setCaret] = useState(0);
    const [highlight, setHighlight] = useState(0);
    const [pendingCaret, setPendingCaret] = useState<number | null>(null);

    const resize = () => {
        const el = ref.current;
        if (!el) {
            return;
        }
        el.style.height = "auto";
        const next = Math.min(el.scrollHeight, maxHeight);
        el.style.height = `${next}px`;
        el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
    };

    useLayoutEffect(() => {
        resize();
    }, [value]);

    useLayoutEffect(() => {
        if (pendingCaret !== null && ref.current) {
            ref.current.selectionStart = pendingCaret;
            ref.current.selectionEnd = pendingCaret;
            ref.current.focus();
            setPendingCaret(null);
        }
    });

    const matches =
        query !== null
            ? users
                  .filter(user => {
                      if (excludeUserId && user.id === excludeUserId) {
                          return false;
                      }
                      const q = query.toLowerCase();
                      return (
                          user.displayName.toLowerCase().includes(q) ||
                          (user.email || "").toLowerCase().includes(q)
                      );
                  })
                  .slice(0, 6)
            : [];

    const detect = (text: string, position: number) => {
        if (dismissedRef.current) {
            setQuery(null);
            return;
        }
        const match = text.slice(0, position).match(MENTION_RE);
        if (match) {
            setQuery(match[1]);
            setAtIndex(position - match[1].length - 1);
            setHighlight(0);
        } else {
            setQuery(null);
        }
    };

    const accept = (user: CollabUser) => {
        const insert = `@${user.displayName} `;
        const next = value.slice(0, atIndex) + insert + value.slice(caret);
        onChange(next);
        onMention?.(user.id);
        setQuery(null);
        setPendingCaret(atIndex + insert.length);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Always isolate keys from the CMS editor's global shortcuts.
        event.stopPropagation();

        if (query !== null && matches.length > 0) {
            if (event.key === "ArrowDown") {
                event.preventDefault();
                setHighlight(h => (h + 1) % matches.length);
                return;
            }
            if (event.key === "ArrowUp") {
                event.preventDefault();
                setHighlight(h => (h - 1 + matches.length) % matches.length);
                return;
            }
            if (event.key === "Enter" || event.key === "Tab") {
                event.preventDefault();
                accept(matches[highlight]);
                return;
            }
            if (event.key === "Escape") {
                event.preventDefault();
                dismissedRef.current = true;
                setQuery(null);
                return;
            }
        }

        onKeyDown?.(event);
    };

    return (
        <div className="wby-collab-mention-wrap">
            <TextareaPrimitive
                textareaRef={ref}
                variant="ghost"
                // `forwardEventOnChange` makes the primitive pass the native event (not just the
                // value) so we can keep reading `event.target.selectionStart` for caret detection.
                forwardEventOnChange
                className={`${className ?? ""} min-h-0`}
                value={value}
                placeholder={placeholder}
                autoFocus={autoFocus}
                rows={1}
                onChange={event => {
                    // Typing re-enables suggestions after an Esc dismissal.
                    dismissedRef.current = false;
                    onChange(event.target.value);
                    const position = event.target.selectionStart ?? event.target.value.length;
                    setCaret(position);
                    detect(event.target.value, position);
                }}
                onClick={event => {
                    const el = event.currentTarget;
                    const position = el.selectionStart ?? 0;
                    setCaret(position);
                    detect(el.value, position);
                }}
                onKeyUp={event => {
                    const el = event.currentTarget;
                    const position = el.selectionStart ?? 0;
                    setCaret(position);
                    detect(el.value, position);
                }}
                onKeyDown={handleKeyDown}
                onBlur={() => window.setTimeout(() => setQuery(null), 120)}
            />
            {query !== null && matches.length > 0 ? (
                <div className="wby-collab-mention-menu">
                    {matches.map((user, index) => (
                        <button
                            key={user.id}
                            className={
                                index === highlight
                                    ? "wby-collab-mention-item is-active"
                                    : "wby-collab-mention-item"
                            }
                            onMouseDown={event => {
                                event.preventDefault();
                                accept(user);
                            }}
                        >
                            <span
                                className="wby-collab-avatar wby-collab-avatar--sm"
                                style={{ background: avatarColor(user.displayName) }}
                            >
                                {initials(user.displayName)}
                            </span>
                            <span className="wby-collab-mention-item__main">
                                <span className="wby-collab-mention-item__name">
                                    {user.displayName}
                                </span>
                                {user.email ? (
                                    <span className="wby-collab-mention-item__email">
                                        {user.email}
                                    </span>
                                ) : null}
                            </span>
                        </button>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
