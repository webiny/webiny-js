import { Kernel } from "@webiny/api-kernel-core";
import type { KernelSetup } from "@webiny/api-kernel-core";
import { AwsLambdaKernelPlatform } from "./AwsLambdaKernelPlatform.js";
import type { AwsLambdaInvocation } from "./AwsLambdaKernelPlatform.js";

export interface CreateLambdaHandlerOptions {
    root: KernelSetup;
    child?: KernelSetup;
}

/**
 * Thin AWS-Lambda-shaped wrapper over the platform-agnostic `Kernel`. The only
 * AWS-specific behavior — binding the raw Lambda event + context into the request container, and
 * the execution id — lives in {@link AwsLambdaKernelPlatform}; everything else is the shared
 * handler loop.
 */
export function createLambdaHandler(options: CreateLambdaHandlerOptions) {
    const app = Kernel.init({
        root: options.root,
        child: options.child,
        platform: AwsLambdaKernelPlatform
    });

    return (...invocation: AwsLambdaInvocation): Promise<any> => app.handle(...invocation);
}
