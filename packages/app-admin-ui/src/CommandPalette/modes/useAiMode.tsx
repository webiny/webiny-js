import React, { useCallback, useEffect, useMemo } from "react";
import { ReactComponent as AiIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as ReturnIcon } from "@webiny/icons/keyboard_return.svg";
import { ReactComponent as BackspaceIcon } from "@webiny/icons/backspace.svg";
import { AiModeBadge, AiSuggestions, AiTurn, HintIcon, type Hint } from "../components/index.js";
import { useAiChat } from "../useAiChat.js";
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
    const ai = useAiChat();

    // Keep the newest turn in view; answers are long enough to push earlier ones off-screen.
    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [scrollRef, ai.turns, ai.busy]);

    const enter = useCallback(
        (seed?: string) => {
            if (seed?.trim()) {
                ai.ask(seed);
            }
        },
        [ai]
    );

    const handleKey = useCallback(
        (event: React.KeyboardEvent, context: PaletteModeKeyContext) => {
            if (event.key === "Enter") {
                event.preventDefault();
                ai.ask(context.query);
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
        [ai]
    );

    const body = useMemo(() => {
        if (ai.turns.length === 0) {
            return <AiSuggestions onAsk={ai.ask} />;
        }

        return ai.turns.map((turn, index) => (
            <AiTurn
                key={index}
                turn={turn}
                initials="You"
                busy={ai.busy}
                onApprove={() => ai.decide(index, true)}
                onReject={() => ai.decide(index, false)}
            />
        ));
    }, [ai]);

    return useMemo(
        () => ({
            appearance: {
                icon: <AiIcon />,
                iconColor: "accent" as const,
                iconLabel: "Ask AI",
                badge: <AiModeBadge />,
                placeholder: ai.turns.length > 0 ? "Ask a follow-up…" : "Ask about your content…",
                footerLabel: "Webiny AI",
                hints: HINTS,
                tall: true
            },
            body,
            enter,
            reset: ai.reset,
            handleKey
        }),
        [ai.turns.length, ai.reset, body, enter, handleKey]
    );
};
