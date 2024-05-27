import { calculateAmounts } from "~/tasks/CarsMock/calculateAmounts";

describe("calculateAmounts", () => {
    it("should properly calculate the amount of tasks and records - 50", async () => {
        const values = calculateAmounts(50);

        expect(values).toEqual({
            amountOfTasks: 1,
            amountOfRecords: 50
        });
    });
    it("should properly calculate the amount of tasks and records - 100", async () => {
        const values = calculateAmounts(100);

        expect(values).toEqual({
            amountOfTasks: 1,
            amountOfRecords: 100
        });
    });
    it("should properly calculate the amount of tasks and records - 249", async () => {
        const values = calculateAmounts(249);

        expect(values).toEqual({
            amountOfTasks: 1,
            amountOfRecords: 249
        });
    });
    it("should properly calculate the amount of tasks and records - 251", async () => {
        const values = calculateAmounts(251);

        expect(values).toEqual({
            amountOfTasks: 1,
            amountOfRecords: 251
        });
    });

    it("should properly calculate the amount of tasks and records - 500", async () => {
        const values = calculateAmounts(500);

        expect(values).toEqual({
            amountOfTasks: 1,
            amountOfRecords: 500
        });
    });

    it("should properly calculate the amount of tasks and records - 999", async () => {
        const values = calculateAmounts(999);

        expect(values).toEqual({
            amountOfTasks: 1,
            amountOfRecords: 999
        });
    });

    it("should properly calculate the amount of tasks and records - 9999", async () => {
        const values = calculateAmounts(9999);

        expect(values).toEqual({
            amountOfTasks: 5,
            amountOfRecords: 2000
        });
    });

    it("should properly calculate the amount of tasks and records - 10001", async () => {
        const values = calculateAmounts(10001);

        expect(values).toEqual({
            amountOfTasks: 5,
            amountOfRecords: 2000
        });
    });

    it("should properly calculate the amount of tasks and records - 25001", async () => {
        const values = calculateAmounts(25001);

        expect(values).toEqual({
            amountOfTasks: 5,
            amountOfRecords: 5000
        });
    });

    it("should properly calculate the amount of tasks and records - 250000", async () => {
        const values = calculateAmounts(250000);

        expect(values).toEqual({
            amountOfTasks: 10,
            amountOfRecords: 25000
        });
    });

    it("should properly calculate the amount of tasks and records - 990000", async () => {
        const values = calculateAmounts(990000);

        expect(values).toEqual({
            amountOfTasks: 20,
            amountOfRecords: 49500
        });
    });

    it("should properly calculate the amount of tasks and records - 2900000", async () => {
        const values = calculateAmounts(2900000);

        expect(values).toEqual({
            amountOfTasks: 50,
            amountOfRecords: 58000
        });
    });

    it("should properly calculate the amount of tasks and records - 3100000", async () => {
        const values = calculateAmounts(3100000);

        expect(values).toEqual({
            amountOfTasks: 50,
            amountOfRecords: 62000
        });
    });

    it("should properly calculate the amount of tasks and records - 5100000", async () => {
        const values = calculateAmounts(5100000);

        expect(values).toEqual({
            amountOfTasks: 100,
            amountOfRecords: 51000
        });
    });

    it("should properly calculate the amount of tasks and records - 10000000", async () => {
        const values = calculateAmounts(10000000);

        expect(values).toEqual({
            amountOfTasks: 100,
            amountOfRecords: 100000
        });
    });

    it("should properly calculate the amount of tasks and records - 10000001", async () => {
        expect.assertions(1);

        try {
            calculateAmounts(10000001);
        } catch (ex) {
            expect(ex.message).toBe(`No valid value found - input value is too large: 10000001.`);
        }
    });

    it("should properly calculate the amount of tasks and records - 50000000", async () => {
        expect.assertions(1);

        try {
            calculateAmounts(50000000);
        } catch (ex) {
            expect(ex.message).toBe(`No valid value found - input value is too large: 50000000.`);
        }
    });
});
