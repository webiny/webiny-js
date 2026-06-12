import { describe, it, expect, beforeEach } from "vitest";
import { ServiceDiscovery } from "../ServiceDiscovery.js";
import type { IServiceManifestLoader } from "../ServiceDiscovery.js";

describe("ServiceDiscovery", () => {
    beforeEach(() => {
        ServiceDiscovery.clear();
    });

    it("should throw if no loader is set", async () => {
        (ServiceDiscovery as any).loader = undefined;

        await expect(ServiceDiscovery.load()).rejects.toThrow(
            "ServiceDiscovery loader not configured"
        );
    });

    it("should load manifests and combine them by name", async () => {
        const loader: IServiceManifestLoader = {
            async load() {
                return [
                    { name: "api", manifest: { cloudfront: { distributionId: "123" } } },
                    { name: "core", manifest: { bucket: { name: "my-bucket" } } }
                ];
            }
        };

        ServiceDiscovery.setLoader(loader);

        const result = await ServiceDiscovery.load();

        expect(result).toEqual({
            api: { cloudfront: { distributionId: "123" } },
            core: { bucket: { name: "my-bucket" } }
        });
    });

    it("should cache the result and not call loader again", async () => {
        let callCount = 0;
        const loader: IServiceManifestLoader = {
            async load() {
                callCount++;
                return [{ name: "api", manifest: { url: "https://example.com" } }];
            }
        };

        ServiceDiscovery.setLoader(loader);

        await ServiceDiscovery.load();
        await ServiceDiscovery.load();
        await ServiceDiscovery.load();

        expect(callCount).toBe(1);
    });

    it("should return undefined when loader returns undefined", async () => {
        const loader: IServiceManifestLoader = {
            async load() {
                return undefined;
            }
        };

        ServiceDiscovery.setLoader(loader);

        const result = await ServiceDiscovery.load();
        expect(result).toBeUndefined();
    });

    it("should reload after clear()", async () => {
        let callCount = 0;
        const loader: IServiceManifestLoader = {
            async load() {
                callCount++;
                return [{ name: "api", manifest: { version: callCount } }];
            }
        };

        ServiceDiscovery.setLoader(loader);

        const first = await ServiceDiscovery.load();
        expect(first).toEqual({ api: { version: 1 } });

        ServiceDiscovery.clear();

        const second = await ServiceDiscovery.load();
        expect(second).toEqual({ api: { version: 2 } });
        expect(callCount).toBe(2);
    });
});
