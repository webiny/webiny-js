import { createTaskInput } from "~/taskInput";

interface MyInput {
    test: boolean;
    file: string;
}

describe("create task input", () => {
    it("should create task input", async () => {
        const input = createTaskInput({
            type: "aMockTaskType",
            input: {
                test: true,
                file: "test.txt"
            }
        });

        expect(input).toEqual({
            type: "aMockTaskType",
            input: {
                test: true,
                file: "test.txt"
            }
        });
    });
});
