import type { Container } from "@webiny/di";
import { KernelPlatform } from "./KernelPlatform.js";

/**
 * The default platform: binds nothing and has no invocation id of its own, so the event passes
 * straight through and each execution gets a generated id. This is what the standalone Node server
 * and the test handlers run on.
 */
class NoopKernelPlatformImpl implements KernelPlatform.Interface {
    bind(_container: Container, _rawArgs: any[]): void {}

    getExecutionId(_rawArgs: any[]): string | undefined {
        return undefined;
    }
}

export const NoopKernelPlatform = KernelPlatform.createImplementation({
    implementation: NoopKernelPlatformImpl,
    dependencies: []
});
