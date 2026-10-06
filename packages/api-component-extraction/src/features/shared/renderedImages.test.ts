import { describe, expect, it } from "vitest";
import { renderedImageCount } from "./renderedImages.js";

describe("renderedImageCount", () => {
    it("counts each image once, however it was referenced", () => {
        expect(
            renderedImageCount(
                [
                    "https://cdn.example.com/a/pool.jpg?w=800",
                    "https://cdn.example.com/a/pool.jpg?w=1600",
                    "https://cdn.example.com/a/gym.jpg"
                ],
                []
            )
        ).toBe(2);
    });

    it("does not count an image that failed to load", () => {
        expect(
            renderedImageCount(
                ["https://cdn.example.com/a/pool.jpg", "https://cdn.example.com/a/gym.jpg"],
                ["https://cdn.example.com/a/gym.jpg"]
            )
        ).toBe(1);
    });

    it("does not count inline data images or empty sources", () => {
        expect(renderedImageCount(["data:image/png;base64,AAAA", ""], [])).toBe(0);
    });
});
