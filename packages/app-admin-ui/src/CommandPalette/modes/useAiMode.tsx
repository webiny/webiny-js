import React, { useCallback, useEffect, useMemo } from "react";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as BackspaceIcon } from "@webiny/icons/backspace.svg";
import { AiModeBadge, AiSuggestions, AiTurn, HintIcon, type Hint } from "../components/index.js";
import { useFeature } from "@webiny/app";
import { AiChatFeature } from "@webiny/app-admin";
import type { PaletteMode, PaletteModeKeyContext } from "./PaletteMode.js";

const HINTS: Hint[] = [
    { keys: <HintIcon element={<ReturnIcon />} />, label: "Ask" },
    { keys: <HintIcon element={<BackspaceIcon />} />, label: "Commands" },
    { keys: "esc", label: "Close" }
];

/**
 * The assistant, as a palette mode.
 *
 * Everything specific to it lives here: the conversation, what the input row shows, what Enter and
 * Backspace do, and what fills the panel. The palette itself holds none of it.
 *
 * @param scrollRef the palette's scroll container, so a new turn can be brought into view. The mode
 * does not own that element, it only needs to scroll it.
 */
export const useAiMode = (scrollRef: React.RefObject<HTMLDivElement | null>): PaletteMode => {
    const { presenter } = useFeature(AiChatFeature);
    const { vm } = presenter;

    // Keep the newest turn in view; answers are long enough to push earlier ones off-screen.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [scrollRef, vm.turns, vm.busy]);

    const enter = useCallback(
        (seed?: string) => {
            if (seed?.trim()) {
                presenter.ask(seed);
            }
        },
        [presenter]
    );

    const handleKey = useCallback(
        (event: React.KeyboardEvent, context: PaletteModeKeyContext) => {
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
        [presenter]
    );

    /*
     * Arrow wrappers rather than bare `presenter.ask`: `makeAutoObservable` turns methods into
     * actions but does not bind them, so a detached reference loses `this`.
     */
    const body = useMemo(() => {
        if (vm.turns.length === 0) {
            return <AiSuggestions onAsk={question => presenter.ask(question)} />;
        }

        return vm.turns.map((turn, index) => (
            <AiTurn
                key={index}
                turn={turn}
                initials="You"
                busy={vm.busy}
                onApprove={() => presenter.decide(index, true)}
                onReject={() => presenter.decide(index, false)}
            />
        ));
    }, [presenter, vm.turns, vm.busy]);

    return useMemo(
        () => ({
            appearance: {
                icon: <AiIcon />,
                iconColor: "accent" as const,
                iconLabel: "Ask AI",
                badge: <AiModeBadge />,
                placeholder: vm.turns.length > 0 ? "Ask a follow-up…" : "Ask about your content…",
                footerLabel: "Webiny AI",
                hints: HINTS,
                tall: true
            },
            body,
            enter,
            reset: () => presenter.reset(),
            handleKey
        }),
        [vm.turns.length, presenter, body, enter, handleKey]
    );
};
