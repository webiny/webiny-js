import { createTaskValues } from "~/task";

interface MyInput {
    test: boolean;
    file: string;
}

describe("task values", () => {
    it("should create task values", async () => {
        const values = createTaskValues<MyInput>({
            id: "aMockTaskType",
            values: {
                test: true,
                file: "test.txt"
            }
        });

        expect(values).toEqual({
            id: "aMockTaskType",
            values: {
                test: true,
                file: "test.txt"
            }
        });
    });
});
