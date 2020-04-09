import { blue } from "chalk";
import setupDefaultEnvironment from "./setup/setupDefaultEnvironment";
import { locales } from "./mocks/mockI18NLocales";
import { createUtils } from "./utils";
import headlessPlugins from "../src/handler/plugins";

describe("Model fields", () => {
    let context;
    let instance;

    const { useContext, useDatabase } = createUtils([
        headlessPlugins({ type: "read", environment: "production" })
    ]);

    function createValue(value) {
        return { values: [{ locale: locales.en.id, value }] };
    }

    const db = useDatabase();

    beforeAll(async () => {
        await setupDefaultEnvironment(db);

        // Setup context
        context = await useContext([], {
            event: { headers: { "accept-language": "en-US" } }
        });
    });

    beforeEach(() => {
        const datetime = context.plugins
            .byType("cms-model-field-to-commodo-field")
            .find(pl => pl.fieldType === "datetime");

        const model = context.createEnvironmentBase();

        datetime.dataModel({
            model,
            field: {
                fieldId: "dateTimeWithTimezone",
                type: "datetime",
                settings: { type: "dateTimeWithTimezone" }
            },
            context
        });

        datetime.dataModel({
            model,
            field: {
                fieldId: "dateTimeWithoutTimezone",
                type: "datetime",
                settings: { type: "dateTimeWithoutTimezone" }
            },
            context
        });

        datetime.dataModel({
            model,
            field: {
                fieldId: "date",
                type: "datetime",
                settings: { type: "date" }
            },
            context
        });

        datetime.dataModel({
            model,
            field: {
                fieldId: "time",
                type: "datetime",
                settings: { type: "time" }
            },
            context
        });

        instance = new model();
    });

    describe(`"datetime": ${blue("dateTimeWithTimezone")}`, () => {
        const field = "dateTimeWithTimezone";

        test(`Date object should pass`, () => {
            expect(() => instance.populate({ [field]: createValue(new Date()) })).not.toThrow();
        });

        test(`"random string" should fail`, () => {
            expect(() => instance.populate({ [field]: createValue("random string") })).toThrow();
        });

        test(`"2020-05-04T12:35:17Z" should pass`, () => {
            expect(() => instance.populate({ [field]: createValue("2020-05-04T12:35:17Z") }))
                .resolves;
        });
    });

    describe(`"datetime": ${blue("dateTimeWithoutTimezone")}`, () => {
        const field = "dateTimeWithoutTimezone";

        test(`"2020-05-04 12:35:17" should pass`, async () => {
            instance.populate({ [field]: createValue("2020-05-04 12:35:17") });
            await expect(instance.getField(field).validate()).resolves;
        });

        test(`"2020-15-04 12:35:17" should fail`, async () => {
            instance.populate({ [field]: createValue("2020-15-04 12:35:17") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"2020-15-04 56:35:17" should fail`, async () => {
            instance.populate({ [field]: createValue("2020-15-04 56:35:17") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"2020-15-04" should fail`, async () => {
            instance.populate({ [field]: createValue("2020-15-04") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"12:35:17" should fail`, async () => {
            instance.populate({ [field]: createValue("12:35:17") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });
    });

    describe(`"datetime": ${blue("date")}`, () => {
        const field = "date";

        test(`"2020-11-04" should pass`, async () => {
            instance.populate({ [field]: createValue("2020-11-04") });
            await expect(instance.getField(field).validate()).resolves;
        });

        test(`"2020-15-04" should fail`, async () => {
            instance.populate({ [field]: createValue("2020-15-04") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"2020-15-04 12:45:25" should fail`, async () => {
            instance.populate({ [field]: createValue("2020-15-04 12:45:25") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"12:35:17" should fail`, async () => {
            instance.populate({ [field]: createValue("12:35:17") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });
    });

    describe(`"datetime": ${blue("time")}`, () => {
        const field = "time";

        test(`"12:35:17" should pass`, async () => {
            instance.populate({ [field]: createValue("12:35:17") });
            await expect(instance.getField(field).validate()).resolves;
        });
        test(`"25:35:17" should fail`, async () => {
            instance.populate({ [field]: createValue("25:35:17") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"12:67:17" should fail`, async () => {
            instance.populate({ [field]: createValue("12:67:17") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"12:27:67" should fail`, async () => {
            instance.populate({ [field]: createValue("12:27:67") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });

        test(`"2020-12-04 12:45:25" should fail`, async () => {
            instance.populate({ [field]: createValue("2020-12-04 12:45:25") });
            await expect(instance.getField(field).validate()).rejects.toThrow(/Validation/);
        });
    });
});
