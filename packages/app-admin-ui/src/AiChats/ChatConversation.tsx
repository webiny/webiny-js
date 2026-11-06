import React, { useEffect, useRef } from "react";
import { SidePanelBody } from "@webiny/admin-ui";
import { SidePanelFooter } from "@webiny/admin-ui";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { AnswerSkeleton } from "~/CommandPalette/components/index.js";
import { FollowUps } from "~/CommandPalette/components/index.js";
import { NotSavedAlert } from "~/CommandPalette/components/index.js";
import { assistantLabel } from "~/CommandPalette/components/index.js";
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
}

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
export const ChatConversation = ({ assistant, firstName, startedOn }: ChatConversationProps) => {
    const { turns, busy, opening, storageError, model } = assistant.vm;
    const scrollRef = useRef<HTMLDivElement>(null);

    const ask = (question: string) => assistant.ask(question);
    const waiting = busy || opening;
    const started = turns.length > 0;

    /*
     * Keep the newest turn in view as it streams in. The follow-ups land after the answer and take
     * room of their own, so they are a change too.
     */
    const latest = turns[turns.length - 1];
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
                                {greeting} <strong>Webiny AI assistant</strong>. Ask me about this
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
                    />
                ))}
            </SidePanelBody>
            <SidePanelFooter>
                {storageError ? <NotSavedAlert reason={storageError} /> : null}
                <ChatComposer
                    placeholder={started ? "Ask a follow-up…" : "Ask about this project…"}
                    busy={waiting}
                    assistantLabel={assistantLabel(model)}
                    onAsk={ask}
                />
            </SidePanelFooter>
        </>
    );
};
