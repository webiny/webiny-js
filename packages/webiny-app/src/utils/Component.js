import createComponent from "./createComponent";

export default function Component(options) {
    return function decorator(target) {
        return createComponent(target, options);
    };
}
