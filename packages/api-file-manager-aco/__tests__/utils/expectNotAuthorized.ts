import { expect } from "vitest";

export const expectNotAuthorized = async (
    promise: Promise<any>,
    data: Record<string, any> | null = null
) => {
    await expect(promise).resolves.toMatchObject({
        data: null,
        error: {
            code: "Aco/Folder/NotAuthorizedError",
            data,
            message: "Not authorized."
        }
    });
};

export const expectFileNotAuthorized = async (
    promise: Promise<any>,
    data: Record<string, any> | null = null
) => {
    await expect(promise).resolves.toMatchObject({
        data: null,
        error: {
            code: "FileManager/File/NotAuthorizedError",
            data,
            message: "Not authorized."
        }
    });
};
