import React from "react";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { AiSuggestions } from "../components/index.js";
import { AiConversation } from "../components/index.js";
import { ContinueInChats } from "../components/index.js";
import { CONTINUE_IN_CHATS_AFTER } from "../components/index.js";
import { NotSavedAlert } from "../components/index.js";
import type { Hint } from "../components/index.js";
import type { PaletteMode } from "./PaletteMode.js";
import type { PaletteModeAppearance } from "./PaletteMode.js";
import type { PaletteModeKeyContext } from "./PaletteMode.js";
import { assistantLabel } from "../components/index.js";
import { NO_MODEL_PLACEHOLDER } from "../components/index.js";

const ENTRY_HINTS: Hint[] = [
    { keys: ["↵"], label: "to ask" },
    { keys: ["⌫"], label: "back to commands" }
];

const ASK_HINT: Hint = { keys: ["↵"], label: "ask" };
const OPEN_IN_CHATS_HINT: Hint = { keys: ["⌘", "↵"], label: "open in chats" };
const COMMANDS_HINT: Hint = { keys: ["⌫"], label: "commands" };
const CLOSE_HINT: Hint = { keys: ["esc"], label: "close" };

// With no model set, asking does nothing, so the only keys worth showing are the ways out.
const NOT_CONFIGURED_HINTS: Hint[] = [
    { keys: ["⌫"], label: "back to commands" },
    { keys: ["esc"], label: "close" }
];

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
export interface AiModeOptions {
    /** The signed-in user's initials, shown against each question. */
    initials: string;
    /** Hands the conversation to the AI chats panel, where it carries on. */
    continueInChats: () => void;
    /** Opens the AI settings. Absent for someone who cannot change them. */
    chooseModel?: () => void;
}

export const createAiMode = (
    presenter: AdminAssistantPresenter.Interface,
    { initials, continueInChats, chooseModel }: AiModeOptions
): PaletteMode => {
    // How many turns the panel showed last time, so a new question is told apart from a re-render.
    let shownTurns = 0;

    const conversationHints = (): Hint[] => {
        if (presenter.vm.turns.length >= CONTINUE_IN_CHATS_AFTER) {
            return [ASK_HINT, OPEN_IN_CHATS_HINT, COMMANDS_HINT, CLOSE_HINT];
        }
        return [ASK_HINT, COMMANDS_HINT, CLOSE_HINT];
    };

    return {
        get appearance() {
            const { turns, model, setupRequired } = presenter.vm;
            const started = turns.length > 0;

            const appearance: PaletteModeAppearance = {
                icon: <AiIcon />,
                iconColor: "accent",
                iconLabel: "Ask AI",
                tag: "Ask AI",
                tagVariant: "accent-light",
                placeholder: started ? "Ask a follow-up…" : "Ask about this project…",
                hints: started ? conversationHints() : ENTRY_HINTS,
                footerStart: assistantLabel(model, setupRequired),
                listBody: !started
            };

            if (setupRequired) {
                appearance.placeholder = NO_MODEL_PLACEHOLDER;
                appearance.hints = NOT_CONFIGURED_HINTS;
                appearance.inputReadOnly = true;
            }

            return appearance;
        },

        get body() {
            const { turns, busy, storageError, saveFailure } = presenter.vm;

            if (turns.length === 0) {
                return <AiSuggestions onAsk={question => presenter.ask(question)} />;
            }

            /*
             * One column with the same gap between every block: the not-saved note, open turns,
             * collapsed turns, and the hand-off strip.
             */
            return (
                <div className="flex flex-col gap-md">
                    {storageError ? (
                        <NotSavedAlert
                            reason={storageError}
                            failure={saveFailure}
                            onRetry={() => presenter.retrySave()}
                            onStartNew={() => presenter.reset()}
                        />
                    ) : null}
                    <AiConversation
                        turns={turns}
                        initials={initials}
                        busy={busy}
                        onApprove={index => presenter.decide(index, true)}
                        onReject={index => presenter.decide(index, false)}
                        onAsk={question => presenter.ask(question)}
                        onRetry={() => presenter.retry()}
                        onChooseModel={chooseModel}
                    />
                    {turns.length >= CONTINUE_IN_CHATS_AFTER ? (
                        <ContinueInChats onContinue={continueInChats} />
                    ) : null}
                </div>
            );
        },

        // A seed only arrives from the no-results "Ask AI" row; see `PaletteMode.enter`.
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
