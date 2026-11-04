import { createVoidComponent } from "@webiny/app";
import { makeDecoratable } from "@webiny/app";

/**
 * Placeholder for the debug capture header control, mirroring AssumedPermissionsSelector. The
 * Layout renders this, and DebuggerExtension decorates it with the real control.
 */
export const DebuggerIndicator = makeDecoratable("DebuggerIndicator", createVoidComponent());
