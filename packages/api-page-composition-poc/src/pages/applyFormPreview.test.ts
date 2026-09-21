import { describe, expect, it } from "vitest";
import type { ComponentManifest } from "@webiny/website-builder-sdk";
import { applyFormPreview, FORM_PREVIEW_NOTICE } from "./applyFormPreview.js";

/** The inputs the generated "Email Contact Form" actually declares. */
const formManifest = (): ComponentManifest =>
    ({
        name: "Custom/Form",
        tags: [],
        inputs: [
            { name: "heading", type: "text" },
            {
                name: "fields",
                type: "object",
                list: true,
                fields: [
                    { name: "label", type: "text" },
                    { name: "inputType", type: "select" }
                ]
            },
            {
                name: "submit",
                type: "object",
                fields: [
                    { name: "label", type: "text" },
                    { name: "url", type: "text" },
                    { name: "variant", type: "select" }
                ]
            },
            { name: "successMessage", type: "longText" },
            { name: "errorMessage", type: "text" }
        ]
    }) as unknown as ComponentManifest;

const apply = (inputs: Record<string, unknown>, componentType = "form") =>
    applyFormPreview({ manifest: formManifest(), componentType, inputs });

describe("applyFormPreview", () => {
    it("says what happens on submit instead of showing nothing", () => {
        expect(apply({ heading: "Get in touch" }).successMessage).toBe(FORM_PREVIEW_NOTICE);
    });

    it("replaces a message that would read as a real confirmation", () => {
        const adjusted = apply({ successMessage: "Thanks — we'll be in touch shortly." });
        expect(adjusted.successMessage).toBe(FORM_PREVIEW_NOTICE);
    });

    it("drops a destination on the submit control so it stays a button", () => {
        // With `submit.url` set the component renders `<a href>` instead of `<button type="submit">`,
        // so the form never submits and the visitor is navigated away instead.
        const adjusted = apply({
            submit: {
                label: "Send",
                url: "https://www.webiny.com/forms/talk-to-us",
                variant: "primary"
            }
        });

        expect(adjusted.submit).toEqual({ label: "Send", variant: "primary" });
    });

    it("leaves the rest of the form alone", () => {
        const adjusted = apply({
            heading: "Not ready for a call just yet",
            fields: [{ label: "Email", inputType: "email" }],
            errorMessage: "Please complete the required fields."
        });

        expect(adjusted.heading).toBe("Not ready for a call just yet");
        expect(adjusted.fields).toEqual([{ label: "Email", inputType: "email" }]);
        expect(adjusted.errorMessage).toBe("Please complete the required fields.");
    });

    it("does nothing to a component that is not a form", () => {
        const inputs = {
            successMessage: "Thanks!",
            submit: { label: "Go", url: "https://site/x" }
        };

        expect(apply(inputs, "hero")).toEqual(inputs);
    });

    it("tolerates a submit input that was never derived", () => {
        expect(apply({ heading: "Contact" })).not.toHaveProperty("submit");
    });
});
