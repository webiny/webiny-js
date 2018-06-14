import injectDeps from "./injectDeps";

export default function inject(options) {
    return function decorator(target) {
        return injectDeps(target, options);
    };
}
