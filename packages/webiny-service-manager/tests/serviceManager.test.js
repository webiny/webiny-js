import { assert } from "chai";
import { ServiceManager } from "./../src";

let serviceManager;

describe("Services test", () => {
    beforeEach(() => {
        serviceManager = new ServiceManager();
    });

    it("should return undefined if service does not exist", () => {
        assert.isUndefined(serviceManager.get("MyService"));
    });

    it("should return empty array if no services are defined", () => {
        assert.isEmpty(serviceManager.getByTag("notification"));
    });

    it("should return a value !== undefined", () => {
        serviceManager.register("Number", () => 12);
        assert.isNumber(serviceManager.get("Number"));
    });

    it("should return the same value on subsequent calls", () => {
        serviceManager.register("Number", () => 12);
        const firstRun = serviceManager.get("Number");
        const secondRun = serviceManager.get("Number");
        assert.strictEqual(firstRun, secondRun);
    });

    it("should return different value on subsequent calls", () => {
        serviceManager.register("Number", () => Math.random() * (100 - 1) + 1, false);
        const firstRun = serviceManager.get("Number");
        const secondRun = serviceManager.get("Number");
        assert.notStrictEqual(firstRun, secondRun);
    });

    it("should return services by tag", () => {
        serviceManager.register("Number", () => 12, true, ["number", "common"]);
        serviceManager.register("String", () => "string", true, ["string", "common"]);

        const numbers = serviceManager.getByTag("number");
        assert.lengthOf(numbers, 1);
        assert.strictEqual(numbers[0], 12);

        const common = serviceManager.getByTag("common");
        assert.lengthOf(common, 2);
        assert.strictEqual(common[0], 12);
        assert.strictEqual(common[1], "string");
    });
});
