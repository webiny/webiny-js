import type { getVpcConfigFromExtension } from "./getVpcConfigFromExtension.js";

export type VpcExtensionConfig = ReturnType<typeof getVpcConfigFromExtension>;

/**
 * Decides whether an app should use a VPC, from the `Infra.Vpc` extension config plus whether the
 * target environment is a production one.
 *
 * Production environments get a VPC by default. An explicit `<Infra.Vpc enabled={false} />` beats
 * that default: `enabled` is documented as a plain toggle, so ignoring it on production would
 * silently do the opposite of what the project config asks for.
 *
 * Shared by the core and api apps so the two cannot disagree — a mismatch would leave the api app's
 * Lambdas configured for subnets the core app never created.
 */
export function isVpcEnabled(config: VpcExtensionConfig, isProduction: boolean): boolean {
    // Explicitly turned off via `<Infra.Vpc enabled={false} />`.
    if (config === false) {
        return false;
    }

    // Explicitly turned on, or given advanced params (useVpcEndpoints / useExistingVpc).
    if (config === true || typeof config === "object") {
        return true;
    }

    // No `Infra.Vpc` extension registered: a VPC is used for production environments only.
    return isProduction;
}
