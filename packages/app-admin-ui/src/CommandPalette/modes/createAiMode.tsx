import React from "react";
import type { AdminAssistantPresenter } from "@webiny/app-admin";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as BackspaceIcon } from "@webiny/icons/backspace.svg";
import { AiModeBadge, AiSuggestions, AiTurn, HintIcon, type Hint } from "../components/index.js";
import type { PaletteMode, PaletteModeKeyContext } from "./PaletteMode.js";

const HINTS: Hint[] = [
    { keys: <HintIcon element={<ReturnIcon />} />, label: "Ask" },
    { keys: <HintIcon element={<BackspaceIcon />} />, label: "Commands" },
    { keys: "esc", label: "Close" }
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
export const createAiMode = (presenter: AdminAssistantPresenter.Interface): PaletteMode => ({
    get appearance() {
        const started = presenter.vm.turns.length > 0;

        return {
            icon: <AiIcon />,
            iconColor: "accent" as const,
            iconLabel: "Ask AI",
            badge: <AiModeBadge />,
            placeholder: started
                ? "Ask a follow-up…"
                : "Ask about your content, or describe an action…",
            footerLabel: "Webiny AI",
            hints: HINTS,
            tall: true
        };
    },

    get body() {
        const { turns, busy } = presenter.vm;

        if (turns.length === 0) {
            return <AiSuggestions onAsk={question => presenter.ask(question)} />;
        }

        // Newest first, so the latest answer sits right under the input it was asked from.
        return turns
            .map((turn, index) => (
                <AiTurn
                    key={index}
                    turn={turn}
                    busy={busy}
                    onApprove={() => presenter.decide(index, true)}
                    onReject={() => presenter.decide(index, false)}
                />
            ))
            .reverse();
    },

    // A seed only arrives from the no-results "Ask AI" button; see `PaletteMode.enter`.
    enter(seed?: string) {
        if (seed?.trim()) {
            presenter.ask(seed);
        }
    },

    reset() {
        presenter.reset();
    },

    handleKey(event: React.KeyboardEvent, context: PaletteModeKeyContext) {
        if (event.key === "Enter") {
            event.preventDefault();
            /*
             * Enter on an empty input runs the plan the newest turn is waiting on, which is what the
             * "Run ↵" button advertises. Only the newest: an older plan is off-screen, and running
             * something the user cannot see is exactly what the approval gate is for.
             */
            const { turns, busy } = presenter.vm;
            const newest = turns.length - 1;
            if (context.query.trim() === "" && !busy && turns[newest]?.pendingApprovals.length) {
                presenter.decide(newest, true);
                return true;
            }
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

    // The newest turn is on top and grows as it streams, so keep the top in view.
    afterRender(container: HTMLElement) {
        container.scrollTo({ top: 0 });
    }
});
