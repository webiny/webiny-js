import { useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "@webiny/app";
import { useDialogs } from "@webiny/app-admin";

const UNNAMED = "this workflow";

/*
 * Protects a dirty draft when the admin leaves the page (R279, QBZ-17). While `dirty` is true, a
 * router transition guard asks `Discard unsaved changes?` through the admin dialogs (the
 * `ContentModelEditor.tsx` pattern) and `beforeunload` raises the browser's own prompt for closing
 * the tab or reloading; its text cannot be customised.
 *
 * The transition guard is registered only while dirty, never for the editor's whole life: the
 * router blocks transitions with history v5's `history.block`, which adds its own `beforeunload`
 * prompt for as long as any blocker is installed, whatever the guard returns. A guard kept while
 * clean made the browser ask "Leave page?" for an editor with nothing unsaved.
 */
export const useLeaveGuard = (dirty: boolean, name: string): void => {
    const router = useRouter();
    const dialogs = useDialogs();

    const routerRef = useRef(router);
    routerRef.current = router;
    const dialogsRef = useRef(dialogs);
    dialogsRef.current = dialogs;
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    const nameRef = useRef(name);
    nameRef.current = name;

    useEffect(() => {
        if (!dirty) {
            return;
        }

        return routerRef.current.addTransitionGuard({
            guard: () => dirtyRef.current,
            onBlocked: () => {
                let accepted = false;
                let label = nameRef.current;
                if (label === "") {
                    label = UNNAMED;
                }

                dialogsRef.current.showDialog({
                    title: "Discard unsaved changes?",
                    content: `You have unsaved changes to “${label}”. If you leave this workflow now, they are lost.`,
                    acceptLabel: "Discard changes",
                    cancelLabel: "Keep editing",
                    onAccept: () => {
                        accepted = true;
                        routerRef.current.confirmTransition();
                    },
                    // The admin dialogs also call `onClose` after `onAccept`.
                    onClose: () => {
                        if (!accepted) {
                            routerRef.current.cancelTransition();
                        }
                    }
                });
            }
        });
    }, [dirty]);

    useEffect(() => {
        if (!dirty) {
            return;
        }

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [dirty]);
};
