import fontawesome from "@fortawesome/fontawesome";

const { far, fas } = fontawesome.library.definitions;

export default [
    ...Object.keys(far).map(k => ({
        id: "far-" + k,
        prefix: "far",
        icon: k
    })),
    ...Object.keys(fas).map(k => ({
        id: "fas-" + k,
        prefix: "fas",
        icon: k
    }))
];
