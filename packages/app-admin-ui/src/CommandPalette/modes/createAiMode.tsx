import React from "react";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as BackspaceIcon } from "@webiny/icons/backspace.svg";
import { AiModeBadge } from "../components/index.js";
import { AiSuggestions } from "../components/index.js";
import { AiTurn } from "../components/index.js";
import { ContinueInChats } from "../components/index.js";
import { CONTINUE_IN_CHATS_AFTER } from "../components/index.js";
import { HintIcon } from "../components/index.js";
import type { Hint } from "../components/index.js";
import type { PaletteMode, PaletteModeKeyContext } from "./PaletteMode.js";

const HINTS: Hint[] = [
    { keys: <HintIcon element={<ReturnIcon />} />, label: "Ask" },
    { keys: <HintIcon element={<BackspaceIcon />} />, label: "Commands" },
    { keys: "esc", label: "Close" }
];

const OPEN_IN_CHATS_HINT: Hint = {
    keys: (
        <>
            ⌘
            <HintIcon element={<ReturnIcon />} />
        </>
    ),
    label: "Open in chats"
};

/*
 * Stands in for the AI chats panel, which does not exist yet. It is the one place the hand-off
 * happens, so wiring the panel up later changes this and nothing else.
 */
const continueInChats = (): void => {
    window.alert(
        "AI chats are not available yet. This conversation will open there once they are."
    );
};

/**
 * "anthropic/claude-sonnet-4-5" reads as "claude-sonnet-4-5". The vendor is noise in a footer, and
 * the model id is what someone checking which model answered will look for.
 */
const modelLabel = (model: string | undefined): string => {
    if (!model) {
        return "Webiny AI";
    }

    return `Webiny AI · ${model.slice(model.indexOf("/") + 1)}`;
};

/**
 * The assistant, as a palette mode.
 *
 * Everything specific to it lives here: what the input row shows, what Enter and Backspace do, and
 * what fills the panel. The conversation itself belongs to `AdminAssistantPresenter`.
 *
 * A plain object rather than a hook. `appearance` and `body` are getters, so reading them during a
 * reactive component's render tracks the presenter's observables and re-renders on a new turn, with
 * no dependency arrays to keep honest.
 */
/** How close to the bottom counts as reading the newest text, so the stream may follow it. */
const FOLLOW_THRESHOLD = 100;

export const createAiMode = (presenter: AdminAssistantPresenter.Interface): PaletteMode => {
    // How many turns the panel showed last time, so a new question is told apart from a re-render.
    let shownTurns = 0;
    // Where the last automatic scroll left the panel. Above it means the reader scrolled up.
    let autoScrollTop = 0;

    return {
        get appearance() {
            const started = presenter.vm.turns.length > 0;
            const offerChats = presenter.vm.turns.length >= CONTINUE_IN_CHATS_AFTER;

            return {
                icon: <AiIcon />,
                iconColor: "accent" as const,
                iconLabel: "Ask AI",
                badge: <AiModeBadge />,
                placeholder: started ? "Ask a follow-up…" : "Ask about this project…",
                footerLabel: modelLabel(presenter.vm.model),
                hints: offerChats
                    ? [...HINTS.slice(0, 1), OPEN_IN_CHATS_HINT, ...HINTS.slice(1)]
                    : HINTS,
                tall: true
            };
        },

        get body() {
            const { turns, busy } = presenter.vm;

            if (turns.length === 0) {
                return <AiSuggestions onAsk={question => presenter.ask(question)} />;
            }

            return (
                <>
                    {turns.map((turn, index) => (
                        <AiTurn
                            key={index}
                            turn={turn}
                            latest={index === turns.length - 1}
                            busy={busy}
                            onApprove={() => presenter.decide(index, true)}
                            onReject={() => presenter.decide(index, false)}
                            onAsk={question => presenter.ask(question)}
                        />
                    ))}
                    {turns.length >= CONTINUE_IN_CHATS_AFTER ? (
                        <ContinueInChats onContinue={continueInChats} />
                    ) : null}
                </>
            );
        },

        // A seed only arrives from the no-results "Ask AI" button; see `PaletteMode.enter`.
        enter(seed?: string) {
            if (seed?.trim()) {
                presenter.ask(seed);
            }
        },

        reset() {
            presenter.reset();
            shownTurns = 0;
            autoScrollTop = 0;
        },

        handleKey(event: React.KeyboardEvent, context: PaletteModeKeyContext) {
            // Cmd+Enter (Ctrl+Enter elsewhere) hands the conversation to the chats panel, once offered.
            if (
                event.key === "Enter" &&
                (event.metaKey || event.ctrlKey) &&
                presenter.vm.turns.length >= CONTINUE_IN_CHATS_AFTER
            ) {
                event.preventDefault();
                continueInChats();
                return true;
            }

            if (event.key === "Enter") {
                event.preventDefault();
                presenter.ask(context.query);
                context.setQuery("");
                return true;
            }

            // Backspace on an empty input leaves the mode, mirroring how space entered it.
            if (event.key === "Backspace" && context.query === "") {
                event.preventDefault();
                context.exit();
                return true;
            }

            return false;
        },

        /*
         * New text arrives at the bottom. A new question always scrolls there. While an answer
         * streams, the panel follows it only if the reader has not scrolled up: scrolling on every
         * token pulled anyone reading an earlier turn back down, a line at a time.
         *
         * Decided here, from positions, not from scroll events. An event arrives a frame after the
         * scroll, and a token can re-render in between, which would snap the reader back down.
         * Streamed text only adds height, so a reader still sits at or below the last automatic
         * position unless they moved up, or within reach of the bottom once they come back.
         */
        afterRender(container: HTMLElement) {
            const count = presenter.vm.turns.length;
            const fromBottom =
                container.scrollHeight - container.scrollTop - container.clientHeight;
            const following =
                container.scrollTop >= autoScrollTop - 1 || fromBottom < FOLLOW_THRESHOLD;

            if (count > shownTurns || following) {
                // The target, not a read-back: a smooth scroll has not moved yet when this runs.
                autoScrollTop = container.scrollHeight - container.clientHeight;
                container.scrollTo({ top: autoScrollTop });
            }
            shownTurns = count;
        }
    };
};
