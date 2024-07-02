// @ts-expect-error Mock `requestAnimationFrame`.
global.requestAnimationFrame = (fn: () => void) => fn();
