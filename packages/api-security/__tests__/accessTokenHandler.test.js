import { mockedUser, mockedToken } from "./mocks";
import useValidatePatHandler from "./useValidatePatHandler";

describe("Personal Access Tokens [Lambda Handler] test suite", () => {
    const { invoke, database } = useValidatePatHandler();

    beforeAll(async () => {
        await database.collection("SecurityUser").insert(mockedUser);
        await database.collection("SecurityPersonalAccessToken").insert({
            ...mockedToken,
            user: mockedUser.id
        });
    });

    it("should validate PAT", async () => {
        const user = await invoke({
            pat: mockedToken.token
        });

        expect(user).toBeTruthy();
        expect(user.id).toBe(mockedUser.id);
        expect(user.type).toBe("user");
        expect(user.access).toEqual({ scopes: [], roles: [], fullAccess: false });
    });
});
