export const isChildOfLinkEditor = (element: HTMLElement | null): boolean => {
    const parent = element ? element.parentElement : null;

    if (!parent) {
        return false;
    }

    if (parent.classList.contains("link-editor")) {
        return true;
    }

    return isChildOfLinkEditor(parent);
};
