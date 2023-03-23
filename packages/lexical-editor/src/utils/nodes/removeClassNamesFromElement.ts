export function removeClassNamesFromElement(
    element: HTMLElement,
    ...classNames: Array<typeof undefined | boolean | null | string>
): void {
    classNames.forEach((className) => {
        if (typeof className === 'string') {
            element.classList.remove(...className.split(' '));
        }
    });
}
