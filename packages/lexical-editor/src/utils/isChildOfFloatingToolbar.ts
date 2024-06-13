export const isChildOfFloatingToolbar = (element: HTMLElement | null): boolean => {
    const parent = element ? element.parentElement : null;

    if (!parent) {
        return false;
    }

    if (parent.classList.contains("floating-toolbar")) {
        return true;
    }

    return isChildOfFloatingToolbar(parent);
};
