import useContentHandler from "./utils/useContentHandler";

describe("Invalid type and environment URL params test", () => {
    it("should respond with proper error messages", async () => {
        const { invoke } = useContentHandler();
        let [body1] = await invoke({
            pathParameters: { key: "read123/xyz" }
        });

        expect(body1.error.message).toEqual(
            "Could not load environment, please check if the passed environment alias slug or environment ID is correct."
        );

        let [body2] = await invoke({
            pathParameters: { key: "read/xyz" }
        });

        expect(body2.error.message).toEqual(
            "Could not load environment, please check if the passed environment alias slug or environment ID is correct."
        );
    });
});
