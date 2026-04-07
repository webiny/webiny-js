import { describe, it, expect } from "vitest";
import { compress, decompress } from "~/features/compression/legacy/gzip";

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
    "H4sIAAAAAAAAEyXMMQvCMBCG4b8SvvkGtbpkKzoJTo7icDVHckgTSQ6klv53Kd2e5X1nZB4FHteSsrsUAYGjwHc7AodQpTX4Gc2qiMFjf+jcjTW7u4HwUpvg0efJyjeD0Ixt3Z17EH762YrjCQshlWFQafAPVOGgOYIQedyQ9L3iufwBfHAQEZMAAAA=";

describe("gzip", () => {
    it("should compress the data", async () => {
        const value = await compress(JSON.stringify(testingData));

        expect(value.toString("utf-8")).toBeString();
    });

    it("should decompress the data", async () => {
        const value = await decompress(Buffer.from(testingDataPacked, "base64"));

        expect(value.toString("utf8")).toEqual(JSON.stringify(testingData));
    });
});
