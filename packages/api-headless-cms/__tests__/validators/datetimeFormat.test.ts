import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";

const eventModel = createPrivateModelPlugin({
    titleFieldId: "title",
    name: "Event",
    modelId: "event",
    fields: [
        createModelField({
            id: "title",
            fieldId: "title",
            type: "text",
            label: "Title"
        }),
        createModelField({
            id: "eventDate",
            fieldId: "eventDate",
            type: "datetime",
            label: "Event Date",
            settings: { type: "date" }
        }),
        createModelField({
            id: "eventTime",
            fieldId: "eventTime",
            type: "datetime",
            label: "Event Time",
            settings: { type: "time" }
        }),
        createModelField({
            id: "eventDateTime",
            fieldId: "eventDateTime",
            type: "datetime",
            label: "Event DateTime",
            settings: { type: "dateTimeWithTimezone" }
        })
    ]
});

const expectValidationError = async (promise: Promise<any>, fieldId: string, pattern: RegExp) => {
    try {
        await promise;
        throw new Error("Expected validation error but entry was created successfully");
    } catch (error: any) {
        expect(error.message).toBe("Validation failed.");
        expect(Array.isArray(error.data)).toBe(true);
        const fieldError = error.data.find((f: any) => f.fieldId === fieldId);
        expect(fieldError).toBeDefined();
        expect(fieldError.error).toMatch(pattern);
    }
};

describe("datetime format validation at use-case level", () => {
    const { handler, tenant } = useHandler({
        plugins: [eventModel]
    });

    const getContext = () =>
        handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": tenant.id }
        });

    describe("date field (settings.type = 'date')", () => {
        it("should accept YYYY-MM-DD", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            const entry = await context.cms.createEntry(model!, {
                values: { title: "Test", eventDate: "2026-07-01" }
            });

            expect(entry.values.eventDate).toBe("2026-07-01");
        });

        it("should reject a full ISO timestamp", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            await expectValidationError(
                context.cms.createEntry(model!, {
                    values: { title: "Test", eventDate: "2026-07-01T12:00:00.000Z" }
                }),
                "eventDate",
                /Invalid date format/
            );
        });

        it("should reject a time value", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            await expectValidationError(
                context.cms.createEntry(model!, {
                    values: { title: "Test", eventDate: "14:30:00" }
                }),
                "eventDate",
                /Invalid date format/
            );
        });
    });

    describe("time field (settings.type = 'time')", () => {
        it("should accept HH:mm:ss", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            const entry = await context.cms.createEntry(model!, {
                values: { title: "Test", eventTime: "14:30:00" }
            });

            expect(entry.values.eventTime).toBe("14:30:00");
        });

        it("should reject a full ISO timestamp", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            await expectValidationError(
                context.cms.createEntry(model!, {
                    values: { title: "Test", eventTime: "2026-07-01T12:00:00.000Z" }
                }),
                "eventTime",
                /Invalid time format/
            );
        });

        it("should reject a date value", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            await expectValidationError(
                context.cms.createEntry(model!, {
                    values: { title: "Test", eventTime: "2026-07-01" }
                }),
                "eventTime",
                /Invalid time format/
            );
        });
    });

    describe("dateTimeWithTimezone field", () => {
        it("should accept a full ISO 8601 dateTime", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            const entry = await context.cms.createEntry(model!, {
                values: { title: "Test", eventDateTime: "2026-07-01T12:00:00.000+00:00" }
            });

            expect(entry.values.eventDateTime).toBeDefined();
        });

        it("should reject a plain date", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            await expectValidationError(
                context.cms.createEntry(model!, {
                    values: { title: "Test", eventDateTime: "2026-07-01" }
                }),
                "eventDateTime",
                /Invalid dateTime format/
            );
        });

        it("should reject a time-only value", async () => {
            const context = await getContext();
            const model = await context.cms.getModel("event");

            await expectValidationError(
                context.cms.createEntry(model!, {
                    values: { title: "Test", eventDateTime: "14:30:00" }
                }),
                "eventDateTime",
                /Invalid dateTime format/
            );
        });
    });
});
