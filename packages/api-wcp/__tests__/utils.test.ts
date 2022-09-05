import { getWcpProjectEnvironment } from "~/utils";
import { encrypt } from "@webiny/wcp";

const dummyEnvironment = {
    apiKey: "0fc47574-ce3c-49ea-a34b-905ba3e0b242",
    id: "test#giejsafidsafljkdasjlfdsafdjsfjndsa",
    org: {
        id: "test"
    },
    project: {
        id: "test-project"
    }
};

describe("utils", () => {
    beforeEach(() => {
        process.env.WCP_PROJECT_ENVIRONMENT = "";
    });
    it("should return no project environment", async () => {
        const result = getWcpProjectEnvironment();

        expect(result).toEqual(null);
    });

    it("should return decrypted project environment", async () => {
        process.env.WCP_PROJECT_ENVIRONMENT = encrypt(dummyEnvironment);
        const result = getWcpProjectEnvironment();

        expect(result).toEqual(dummyEnvironment);
    });
});
