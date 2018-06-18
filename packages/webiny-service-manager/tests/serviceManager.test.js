import { ServiceManager } from "./../src";

let serviceManager;

describe("Services test", () => {
    beforeEach(() => {
        serviceManager = new ServiceManager();
    });

    test("should return undefined if service does not exist", () => {
        expect(serviceManager.get("MyService")).not.toBeDefined();
    });

    test("should return empty array if no services are defined", () => {
        expect(serviceManager.getByTag("notification")).toHaveLength(0);
    });

    test("should return a value !== undefined", () => {
        serviceManager.register("Number", () => 12);
        expect(typeof serviceManager.get("Number")).toBe("number");
    });

    test("should return the same value on subsequent calls", () => {
        serviceManager.register("Number", () => 12);
        const firstRun = serviceManager.get("Number");
        const secondRun = serviceManager.get("Number");
        expect(firstRun).toBe(secondRun);
    });

    test("should return different value on subsequent calls", () => {
        serviceManager.register("Number", () => Math.random() * (100 - 1) + 1, false);
        const firstRun = serviceManager.get("Number");
        const secondRun = serviceManager.get("Number");
        expect(firstRun).not.toBe(secondRun);
    });

    test("should return services by tag", () => {
        serviceManager.register("Number", () => 12, true, ["number", "common"]);
        serviceManager.register("String", () => "string", true, ["string", "common"]);

        const numbers = serviceManager.getByTag("number");
        expect(numbers.length).toBe(1);
        expect(numbers[0]).toBe(12);

        const common = serviceManager.getByTag("common");
        expect(common.length).toBe(2);
        expect(common[0]).toBe(12);
        expect(common[1]).toBe("string");
    });
});
