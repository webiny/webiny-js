import { describe, expect, it } from "vitest";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { useGqlHandler } from "../useGqlHandler";

const GET_WCP_PROJECT = /* GraphQL */ `
    query GetWcpProject {
        wcp {
            getProject {
                data {
                    package {
                        features {
                            abTesting {
                                enabled
                            }
                            collaboration {
                                enabled
                                options
                            }
                        }
                    }
                }
                error {
                    code
                    message
                }
            }
        }
    }
`;

describe("wcp.getProject", () => {
    it("should return the abTesting and collaboration features from the license", async () => {
        const wcpLicense = createTestWcpLicense();
        wcpLicense.package.features.abTesting = { enabled: true };
        wcpLicense.package.features.collaboration = {
            enabled: true,
            options: { comments: true, activityLog: false }
        };

        const { invoke } = useGqlHandler({ wcpLicense });

        const [response] = await invoke({ body: { query: GET_WCP_PROJECT } });

        expect(response).toEqual({
            data: {
                wcp: {
                    getProject: {
                        data: {
                            package: {
                                features: {
                                    abTesting: { enabled: true },
                                    collaboration: {
                                        enabled: true,
                                        options: { comments: true, activityLog: false }
                                    }
                                }
                            }
                        },
                        error: null
                    }
                }
            }
        });
    });
});
