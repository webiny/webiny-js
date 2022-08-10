import { WcpProjectEnvironment } from "@webiny/wcp/types";

export const mockCreateGetWcpProjectEnvironment = () => {
    return (): WcpProjectEnvironment => ({
        id: "test-org/test-project",
        apiKey: "12345678",
        org: { id: "test-org" },
        project: { id: "test-project" }
    });
};
