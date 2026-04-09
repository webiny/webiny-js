import { describe, it, expect } from "vitest";
import { compress, decompress } from "~/features/compression/legacy/jsonpack";

const testingData = Object.freeze({
    name: "John Doe",
    age: 30,
    address: {
        street: "123 Main St",
        city: "Anytown",
        state: "CA",
        zip: "12345"
    },
    hobbies: ["reading", "gaming", "hiking"]
});

const testingDataPacked =
    "name|John+Doe|age|address|street|123+Main+St|city|Anytown|state|CA|zip|12345|hobbies|reading|gaming|hiking^U^^$0|1|2|G|3|$4|5|6|7|8|9|A|B]|C|@D|E|F]]";

describe("jsonpack", () => {
    it("should compress the data", async () => {
        const value = await compress(testingData);

        expect(value).toEqual(testingDataPacked);
    });

    it("should decompress the data", async () => {
        const value = await decompress(testingDataPacked);

        expect(value).toEqual(testingData);
    });
});
