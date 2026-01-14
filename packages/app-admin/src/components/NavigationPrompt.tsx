import React, { useEffect, useRef } from "react";
import { useRouter } from "@webiny/app-admin";
import { makeDecoratable } from "@webiny/react-composition";
import { useDialogs } from "~/components/Dialogs/useDialogs.js";

interface NavigationPromptProps {
    when: boolean | (() => boolean);
    message: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
}

export const NavigationPrompt = makeDecoratable(
    "NavigationPrompt",
    ({ when, message, confirmLabel, cancelLabel }: NavigationPromptProps) => {
        const whenRef = useRef(when);
        const router = useRouter();
        const dialogs = useDialogs();

        // Update the ref synchronously on every render to ensure we always have the latest value
        whenRef.current = when;

        useEffect(() => {
            router.onRouteExit(transition => {
                const condition = whenRef.current;
                const shouldConfirm = typeof condition === "function" ? condition() : condition;

                if (shouldConfirm) {
                    dialogs.showDialog({
                        title: "Confirm Navigation",
                        content: message,
                        acceptLabel: confirmLabel ?? "Yes!",
                        cancelLabel: cancelLabel ?? "No, stay here.",
                        onAccept: () => {
                            transition.continue();
                        }
                    });
                } else {
                    transition.continue();
                }
            });
        }, []);

        return null;
    }
);
