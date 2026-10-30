import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createNotificationTransport } from "~/editor/testing/editorFixtures.js";
import { createNewStep } from "./createNewStep.js";

describe("createNewStep", () => {
    it("takes the Orange colour, an empty title and no description", () => {
        const step = createNewStep({ id: "s1", type: "review", transports: [] });

        expect(step).toMatchObject({
            id: "s1",
            type: "review",
            title: "",
            color: "var(--color-primary-500)",
            description: null
        });
    });

    it("starts a People step with no team and the review defaults (R270)", () => {
        const step = createNewStep({ id: "s1", type: "review", transports: [] });

        expect(step.config).toEqual({
            teams: [],
            assignment: { strategy: "none", allowManualPick: false, rules: [] }
        });
    });

    it("starts an Automation step with no automation and no settings", () => {
        const step = createNewStep({ id: "s1", type: "automation", transports: [] });

        expect(step.config).toEqual({ automationId: "", settings: {} });
    });

    it("starts an AI step with no model (QBZ-89)", () => {
        const step = createNewStep({ id: "s1", type: "ai", transports: [] });

        expect(step.config).toEqual({ instructions: "", model: "", tools: [] });
    });

    it("ticks e-mail on a new People step when that transport exists (R272, QBZ-45)", () => {
        const transports = [
            createNotificationTransport({ id: "e-mail" }),
            createNotificationTransport({ id: "slack" })
        ];

        const step = createNewStep({ id: "s1", type: "review", transports });

        expect(step.notificationIds).toEqual(["e-mail"]);
    });

    it("ticks nothing when there is no e-mail transport", () => {
        const step = createNewStep({
            id: "s1",
            type: "review",
            transports: [createNotificationTransport({ id: "slack" })]
        });

        expect(step.notificationIds).toEqual([]);
    });

    it("ticks nothing on other types, even with an e-mail transport", () => {
        const transports = [createNotificationTransport({ id: "e-mail" })];

        expect(createNewStep({ id: "a", type: "automation", transports }).notificationIds).toEqual(
            []
        );
        expect(createNewStep({ id: "b", type: "ai", transports }).notificationIds).toEqual([]);
    });

    it("gives every call its own config objects", () => {
        const first = createNewStep({ id: "a", type: "review", transports: [] });
        const second = createNewStep({ id: "b", type: "review", transports: [] });

        expect(first.config).not.toBe(second.config);
    });
});
