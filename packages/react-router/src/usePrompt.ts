/**
 * These hooks re-implement the now removed useBlocker and usePrompt hooks in 'react-router-dom'.
 * Thanks for the idea @piecyk https://github.com/remix-run/react-router/issues/8139#issuecomment-953816315
 * Source: https://github.com/remix-run/react-router/commit/256cad70d3fd4500b1abcfea66f3ee622fb90874#diff-b60f1a2d4276b2a605c05e19816634111de2e8a4186fe9dd7de8e344b65ed4d3L344-L381
 *
 * @see https://gist.github.com/rmorse/426ffcc579922a82749934826fa9f743
 * Thanks to https://github.com/rmorse
 */
import { useContext, useEffect, useCallback } from "react";
import { UNSAFE_NavigationContext as NavigationContext, useLocation } from "react-router-dom";
import { History, Transition } from "history";

type Navigator = Pick<History, "go" | "push" | "replace" | "createHref" | "block">;

interface BlockerCallable {
    (tx: Transition): void;
}
/**
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
 *
 * @see https://reactrouter.com/api/useBlocker
 */
const useBlocker = (blocker: BlockerCallable, when = true) => {
    const ctx = useContext(NavigationContext);
    /**
     * We must use the location values because it is possible for a component which uses Prompt is not unmounted.
     * Example, when switching from CMS entry to another one, if blocker was removed, a new one will not appear because
     * useEffect will not rerun.
     */
    const location = useLocation();
    const url = `${location.pathname}${location.search}`;
    const navigator = ctx.navigator as unknown as Navigator;

    useEffect(() => {
        if (!navigator.block) {
            console.log("Missing navigator block method. It is probably removed in react-router.");
            return;
        }
        if (!when) {
            return;
        }

        const unblock = navigator.block(tx => {
            const autoUnblockingTx = {
                ...tx,
                retry: () => {
                    unblock();
                    tx.retry();
                }
            };

            blocker(autoUnblockingTx);
        });

        return unblock;
    }, [url, navigator, blocker, when]);
};

/**
 * Prompts the user with an Alert before they leave the current screen.
 */
export const usePrompt = (message: string, when = true) => {
    const blocker = useCallback(
        (tx: Transition) => {
            if (window.confirm(message)) {
                tx.retry();
            }
        },
        [message]
    );

    useBlocker(blocker, when);
};
