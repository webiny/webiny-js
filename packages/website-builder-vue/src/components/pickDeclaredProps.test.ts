import { defineAsyncComponent } from "vue";
import { defineComponent } from "vue";
import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { pickDeclaredProps } from "./pickDeclaredProps.js";

const rendererProps = {
    inputs: { title: "Hi" },
    styles: {},
    element: { id: "e1" },
    breakpoint: "desktop"
};

describe("pickDeclaredProps", () => {
    it("keeps only the props an object component declares", () => {
        const component = defineComponent({ props: { inputs: Object, styles: Object } });

        expect(pickDeclaredProps(component, rendererProps)).toEqual({
            inputs: rendererProps.inputs,
            styles: rendererProps.styles
        });
    });

    it("supports props declared as an array", () => {
        const component = defineComponent({ props: ["inputs", "breakpoint"] });

        expect(pickDeclaredProps(component, rendererProps)).toEqual({
            inputs: rendererProps.inputs,
            breakpoint: "desktop"
        });
    });

    it("passes every prop to a component that declares no props", () => {
        const component = defineComponent({ setup: () => () => null });

        expect(pickDeclaredProps(component, rendererProps)).toBe(rendererProps);
    });

    it("passes every prop to an async component, which forwards them to the loaded one", () => {
        const loaded = defineComponent({ props: ["inputs"], setup: () => () => null });
        const component = defineAsyncComponent(() => Promise.resolve(loaded));

        expect(pickDeclaredProps(component, rendererProps)).toBe(rendererProps);
    });

    it("passes every prop to a functional component", () => {
        const component = () => null;

        expect(pickDeclaredProps(component, rendererProps)).toBe(rendererProps);
    });
});
