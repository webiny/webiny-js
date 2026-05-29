import { shallowRef, triggerRef, onMounted, onUnmounted } from "vue";
import { viewportManager } from "@webiny/website-builder-sdk";

/**
 * Returns a reactive ref that contains the current viewport info.
 *
 * Starts with the current value (or a sensible default on the server) and
 * updates whenever the viewport manager fires a change-end event.
 */
export const useViewport = () => {
    const viewport = shallowRef(viewportManager.getViewport());
    let unsubscribe: (() => void) | undefined;

    onMounted(() => {
        // Sync the latest value after mount (in case a resize already happened).
        viewport.value = viewportManager.getViewport();

        unsubscribe = viewportManager.onViewportChangeEnd(newViewport => {
            viewport.value = newViewport;
            triggerRef(viewport);
        });
    });

    onUnmounted(() => unsubscribe?.());

    return viewport;
};
