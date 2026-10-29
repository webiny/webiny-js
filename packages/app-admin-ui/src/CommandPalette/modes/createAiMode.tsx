import React from "react";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { AiSuggestions } from "../components/index.js";
import { AiConversation } from "../components/index.js";
import { ContinueInChats } from "../components/index.js";
import { CONTINUE_IN_CHATS_AFTER } from "../components/index.js";
import type { Hint } from "../components/index.js";
import type { PaletteMode, PaletteModeKeyContext } from "./PaletteMode.js";

const HINTS: Hint[] = [
    { keys: ["↵"], label: "to ask" },
    { keys: ["⌫"], label: "for commands" }
];

const OPEN_IN_CHATS_HINT: Hint = { keys: ["⌘", "↵"], label: "to open in chats" };

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
export const createAiMode = (
    presenter: AdminAssistantPresenter.Interface,
    /** The signed-in user's initials, shown against each question. */
    initials: string,
    /** Hands the conversation to the AI chats panel, where it carries on. */
    continueInChats: () => void
): PaletteMode => {
    // How many turns the panel showed last time, so a new question is told apart from a re-render.
    let shownTurns = 0;

    return {
        get appearance() {
            const started = presenter.vm.turns.length > 0;
            const offerChats = presenter.vm.turns.length >= CONTINUE_IN_CHATS_AFTER;

            return {
                icon: <AiIcon />,
                iconColor: "accent" as const,
                iconLabel: "Ask AI",
                tag: "Ask AI",
                tagVariant: "accent-light" as const,
                placeholder: started ? "Ask a follow-up…" : "Ask about this project…",
                footerLabel: modelLabel(presenter.vm.model),
                hints: offerChats ? [...HINTS, OPEN_IN_CHATS_HINT] : HINTS,
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
                    <AiConversation
                        turns={turns}
                        initials={initials}
                        busy={busy}
                        onApprove={index => presenter.decide(index, true)}
                        onReject={index => presenter.decide(index, false)}
                        onAsk={question => presenter.ask(question)}
                    />
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
         * The newest turn is at the top, so a new question scrolls there. Only a new question: an answer
         * re-renders the panel with every token, and scrolling on each one would pull a reader back up
         * from an earlier turn they opened.
         */
        afterRender(container: HTMLElement) {
            const count = presenter.vm.turns.length;
            if (count > shownTurns) {
                container.scrollTo({ top: 0 });
            }
            shownTurns = count;
        }
    };
};
