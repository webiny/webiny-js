import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { SidePanelBody } from "@webiny/admin-ui";
import { SidePanelFooter } from "@webiny/admin-ui";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { AnswerSkeleton } from "~/CommandPalette/components/index.js";
import { FollowUps } from "~/CommandPalette/components/index.js";
import { NotSavedAlert } from "~/CommandPalette/components/index.js";
import { assistantLabel } from "~/CommandPalette/components/index.js";
import { NO_MODEL_PLACEHOLDER } from "~/CommandPalette/components/index.js";
import { CHAT_STARTERS } from "./chatStarters.js";
import { ChatComposer } from "./ChatComposer.js";
import { ChatTurn } from "./ChatTurn.js";
import { InsightCard } from "./InsightCard.js";

export interface ChatConversationProps {
    assistant: AdminAssistantPresenter.Interface;
    /** The signed-in user's first name, for the greeting. Empty when the profile has none. */
    firstName: string;
    /** When the open chat was created. Absent before its first save. */
    startedOn?: string;
    /** Leaves this chat for a new one, for a chat too large to save. */
    onStartNew: () => void;
    /** Opens the AI settings. Absent for someone who cannot change them. */
    onChooseModel?: () => void;
}

const placeholderFor = (started: boolean, setupRequired: boolean): string => {
    if (setupRequired) {
        return NO_MODEL_PLACEHOLDER;
    }
    return started ? "Ask a follow-up…" : "Ask about this project…";
};

/** "Monday, 2 November", for the date the conversation started. A new chat starts today. */
const dateLabel = (startedOn: string | undefined): string => {
    const date = startedOn ? new Date(startedOn) : new Date();
    return date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
};

/**
 * The conversation the assistant holds, oldest turn first, the way a chat reads.
 *
 * The palette shows the same turns newest first and folds the older ones away, because it is built
 * for a quick ask. Here the whole exchange is the point, so every turn stays open.
 */
export const ChatConversation = ({
    assistant,
    firstName,
    startedOn,
    onStartNew,
    onChooseModel
}: ChatConversationProps) => {
    const { turns, busy, opening, storageError, saveFailure, model, setupRequired } = assistant.vm;
    const scrollRef = useRef<HTMLDivElement>(null);

    const ask = (question: string) => assistant.ask(question);
    const waiting = busy || opening;
    const started = turns.length > 0;
    const latest = turns[turns.length - 1];

    /*
     * Keep the newest turn in view as it streams in. The follow-ups land after the answer and take
     * room of their own, so they are a change too.
     */
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [turns.length, latest?.text, latest?.followUps.length]);

    const greeting = firstName ? `Hi ${firstName}, I'm` : "Hi, I'm";

    return (
        <>
            <SidePanelBody viewportRef={scrollRef}>
                {started ? (
                    <div className="text-center text-sm text-neutral-strong">
                        {dateLabel(startedOn)}
                    </div>
                ) : null}

                {!started && !opening ? (
                    <>
                        <InsightCard>
                            <div className="text-md leading-[22px] text-neutral-primary">
                                {greeting} your <strong>AI assistant</strong>. Ask me about this
                                project, or ask me to change something. I&apos;ll show you the plan
                                and wait for your go-ahead before I change anything.
                            </div>
                        </InsightCard>
                        <FollowUps questions={CHAT_STARTERS} disabled={waiting} onAsk={ask} />
                    </>
                ) : null}

                {opening ? <AnswerSkeleton /> : null}

                {turns.map((turn, index) => (
                    <ChatTurn
                        key={index}
                        turn={turn}
                        latest={index === turns.length - 1}
                        busy={busy}
                        onApprove={() => assistant.decide(index, true)}
                        onReject={() => assistant.decide(index, false)}
                        onAsk={ask}
                        onRetry={() => assistant.retry()}
                        onChooseModel={onChooseModel}
                    />
                ))}
            </SidePanelBody>
            <SidePanelFooter>
                {storageError ? (
                    <NotSavedAlert
                        reason={storageError}
                        failure={saveFailure}
                        onRetry={() => assistant.retrySave()}
                        onStartNew={onStartNew}
                    />
                ) : null}
                <ChatComposer
                    placeholder={placeholderFor(started, setupRequired)}
                    // Asking cannot work until a model is set, so the composer waits for "Try again".
                    disabled={setupRequired}
                    busy={waiting}
                    assistantLabel={assistantLabel(model, setupRequired)}
                    onAsk={ask}
                />
            </SidePanelFooter>
        </>
    );
};
