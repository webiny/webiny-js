import fontawesome from "@fortawesome/fontawesome";

const { far, fas } = fontawesome.library.definitions;

export default [
    ...Object.keys(far).map(k => ({
        value: "far-" + k,
        label: k,
        data: {
            id: "far-" + k,
            prefix: "far",
            icon: k
        }
    })),
    ...Object.keys(fas).map(k => ({
        value: "fas-" + k,
        label: k,
        data: {
            id: "fas-" + k,
            prefix: "fas",
            icon: k
        }
    }))
];
