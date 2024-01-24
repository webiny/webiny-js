import { ITaskIdentity } from "~/types";

export const createMockIdentity = (): ITaskIdentity => {
    return {
        displayName: "John Doe",
        id: "id-12345678",
        type: "admin"
    };
};
