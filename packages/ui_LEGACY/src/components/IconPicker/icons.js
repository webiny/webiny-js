import fontawesome from "@fortawesome/fontawesome";

const { fas } = fontawesome.library.definitions;

export default [
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
