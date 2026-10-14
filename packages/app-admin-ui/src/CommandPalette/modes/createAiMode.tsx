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
export const createAiMode = (presenter: AdminAssistantPresenter.Interface): PaletteMode => ({
    get appearance() {
        const started = presenter.vm.turns.length > 0;

        return {
            icon: <AiIcon />,
            iconColor: "accent" as const,
            iconLabel: "Ask AI",
            badge: <AiModeBadge />,
            placeholder: started ? "Ask a follow-up…" : "Ask about this project…",
            footerLabel: modelLabel(presenter.vm.model),
            hints: HINTS,
            tall: true
        };
    },

    get body() {
        const { turns, busy } = presenter.vm;

        if (turns.length === 0) {
            return <AiSuggestions onAsk={question => presenter.ask(question)} />;
        }

        return turns.map((turn, index) => (
            <AiTurn
                key={index}
                turn={turn}
                latest={index === turns.length - 1}
                busy={busy}
                onApprove={() => presenter.decide(index, true)}
                onReject={() => presenter.decide(index, false)}
                onAsk={question => presenter.ask(question)}
            />
        ));
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

    // Answers are long enough to push earlier turns off-screen, so keep the newest one visible.
    afterRender(container: HTMLElement) {
        container.scrollTo({ top: container.scrollHeight });
    }
});
