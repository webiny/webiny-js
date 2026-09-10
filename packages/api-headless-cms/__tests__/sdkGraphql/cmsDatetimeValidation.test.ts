import { beforeEach, describe, expect, it } from "vitest";
import { useWebinySdk } from "../testHelpers/useWebinySdk";
import { useGraphQLHandler } from "../testHelpers/useGraphQLHandler";
import { setupGroupAndModels } from "../testHelpers/setup";
import { createModelField } from "~/utils/createModelField.js";
import type { TestCmsModel } from "../types";
import type { CmsGroup } from "~/types";

const createEventModel = (group: CmsGroup): TestCmsModel => {
    return {
        modelId: "event",
        singularApiName: "Event",
        pluralApiName: "Events",
        group: group.slug,
        name: "Event",
        description: "Events with datetime fields",
        titleFieldId: "title",
        icon: { type: "fas", name: "calendar" },
        fields: [
            createModelField({
                id: "title",
                storageId: "text@title",
                fieldId: "title",
                type: "text",
                label: "Title",
                validation: [],
                settings: {}
            }),
            createModelField({
                id: "eventDate",
                storageId: "datetime@eventDate",
                fieldId: "eventDate",
                type: "datetime",
                label: "Event Date",
                validation: [],
                settings: {
                    type: "date"
                }
            }),
            createModelField({
                id: "eventTime",
                storageId: "datetime@eventTime",
                fieldId: "eventTime",
                type: "datetime",
                label: "Event Time",
                validation: [],
                settings: {
                    type: "time"
                }
            }),
            createModelField({
                id: "eventDateTime",
                storageId: "datetime@eventDateTime",
                fieldId: "eventDateTime",
                type: "datetime",
                label: "Event DateTime",
                validation: [],
                settings: {
                    type: "dateTimeWithTimezone"
                }
            })
        ],
        layout: [["title"], ["eventDate"], ["eventTime"], ["eventDateTime"]]
    };
};

describe("SDK GraphQL - datetime field format validation", () => {
    const { sdk } = useWebinySdk();
    const manageHandler = useGraphQLHandler({ path: "manage" });

    beforeEach(async () => {
        const { group } = await setupGroupAndModels({
            manager: manageHandler,
            models: undefined
        });

        const eventModel = createEventModel(group);
        await manageHandler.createContentModelMutation({
            data: {
                ...eventModel,
                description: eventModel.description || undefined,
                icon: eventModel.icon || undefined
            }
        });
    });

    describe("date field (settings.type = 'date')", () => {
        it("should accept a valid YYYY-MM-DD value", async () => {
            const result = await sdk.cms.createEntry({
                modelId: "event",
                data: {
                    values: {
                        title: "Valid Date Event",
                        eventDate: "2026-07-01"
                    }
                },
                fields: ["id", "values.eventDate"]
            });

            if (result.isFail()) {
                console.log("Valid date error:", result.error);
            }
            expect(result.isOk()).toBe(true);
            expect(result.value.values?.eventDate).toBe("2026-07-01");
        });

        it("should reject a full ISO timestamp for a date-only field", async () => {
            const result = await sdk.cms.createEntry({
                modelId: "event",
                data: {
                    values: {
                        title: "Invalid Date Event",
                        eventDate: "2026-07-01T12:00:00.000Z"
                    }
                },
                fields: ["id", "values.eventDate"]
            });

            expect(result.isFail()).toBe(true);
        });
    });

    describe("time field (settings.type = 'time')", () => {
        it("should accept a valid HH:mm:ss value", async () => {
            const result = await sdk.cms.createEntry({
                modelId: "event",
                data: {
                    values: {
                        title: "Valid Time Event",
                        eventTime: "14:30:00"
                    }
                },
                fields: ["id", "values.eventTime"]
            });

            expect(result.isOk()).toBe(true);
            expect(result.value.values?.eventTime).toBe("14:30:00");
        });

        it("should reject a full ISO timestamp for a time-only field", async () => {
            const result = await sdk.cms.createEntry({
                modelId: "event",
                data: {
                    values: {
                        title: "Invalid Time Event",
                        eventTime: "2026-07-01T12:00:00.000Z"
                    }
                },
                fields: ["id", "values.eventTime"]
            });

            expect(result.isFail()).toBe(true);
        });
    });

    describe("dateTimeWithTimezone field", () => {
        it("should accept a valid ISO 8601 with timezone", async () => {
            const result = await sdk.cms.createEntry({
                modelId: "event",
                data: {
                    values: {
                        title: "Valid DateTime Event",
                        eventDateTime: "2026-07-01T12:00:00.000+00:00"
                    }
                },
                fields: ["id", "values.eventDateTime"]
            });

            expect(result.isOk()).toBe(true);
        });

        it("should reject a plain date for a dateTimeWithTimezone field", async () => {
            const result = await sdk.cms.createEntry({
                modelId: "event",
                data: {
                    values: {
                        title: "Invalid DateTime Event",
                        eventDateTime: "2026-07-01"
                    }
                },
                fields: ["id", "values.eventDateTime"]
            });

            expect(result.isFail()).toBe(true);
        });
    });
});
