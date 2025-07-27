import { createDeployments, Deployments } from "~/resolver/deployment/Deployments.js";
import { createMockDeployment } from "~tests/mocks/deployments.js";

describe("Deployments", () => {
    it("should create deployments object", () => {
        const mockDeploymentTestBlue = createMockDeployment({
            name: "test#blue",
            env: "test",
            variant: "blue"
        });
        const mockDeploymentTestGreen = createMockDeployment({
            name: "test#green",
            env: "test",
            variant: "green"
        });
        const deployments = createDeployments({
            deployments: [mockDeploymentTestBlue, mockDeploymentTestGreen]
        });

        expect(deployments).toBeInstanceOf(Deployments);
        expect(deployments.hasAny()).toBe(true);
        expect(deployments.get("test#blue")).toBe(mockDeploymentTestBlue);
        expect(deployments.get("test#green")).toBe(mockDeploymentTestGreen);

        const withoutBlue = deployments.without({
            name: "test#blue"
        });
        expect(withoutBlue.hasAny()).toBe(true);
        expect(withoutBlue.get("test#blue")).toBe(null);
        expect(withoutBlue.get("test#green")).toBe(mockDeploymentTestGreen);
    });
});
