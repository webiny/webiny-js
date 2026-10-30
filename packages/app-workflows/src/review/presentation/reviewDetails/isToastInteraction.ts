/*
 * Whether a pointer or focus event outside the modal drawer happened in the toast stack. Closing a
 * toast that an action from the drawer showed must not close Review details too.
 */
export const isToastInteraction = (target: EventTarget | null): boolean => {
    if (!(target instanceof Element)) {
        return false;
    }
    return target.closest("[data-sonner-toaster]") !== null;
};
