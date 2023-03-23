export function addClassNamesToElement(
  element: HTMLElement,
  ...classNames: Array<typeof undefined | boolean | null | string>
): void {
  classNames.forEach((className) => {
    if (typeof className === 'string') {
      const classesToAdd = className.split(' ').filter((n) => n !== '');
      element.classList.add(...classesToAdd);
    }
  });
}
