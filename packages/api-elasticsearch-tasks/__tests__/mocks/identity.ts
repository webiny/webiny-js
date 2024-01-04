import { ITaskIdentity } from "@webiny/tasks/types";

export const createMockIdentity = (): ITaskIdentity => {
    return {
        displayName: "John Doe",
        id: "id-12345678",
        type: "admin"
    };
};
