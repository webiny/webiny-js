import { createAbstraction } from "@webiny/feature/api";
import { NullLicense } from "@webiny/wcp";
import type { ILicense } from "@webiny/wcp/types.js";

export interface IWcpLicenseProvider {
    get(): ILicense;
}

export const WcpLicenseProvider = createAbstraction<IWcpLicenseProvider>("WcpLicenseProvider");

export namespace WcpLicenseProvider {
    export type Interface = IWcpLicenseProvider;
}

/**
 * Holds either a concrete license (tests) or a Promise<ILicense> (production).
 * When given a Promise, starts with NullLicense and swaps in the real license once resolved.
 *
 * TODO: `get()` can return the NullLicense until the load promise resolves. In production
 * `loadWcpLicense()` performs a network fetch to the WCP API, so there is a window — between
 * feature registration and the promise resolving — where a resolver calling `get()` receives
 * NullLicense and feature checks (canUseTeams, canUseAacl, ...) fail closed. This is unlikely
 * in practice (the load is kicked off at registration time, well before the first resolver),
 * but it is not guaranteed. Make `get()` await the in-flight load, or block the handler until
 * the license is ready, so callers can never observe the NullLicense placeholder.
 */
export class WcpLicenseProviderImpl implements IWcpLicenseProvider {
    private current: ILicense;

    constructor(licenseOrPromise: ILicense | Promise<ILicense>) {
        if (licenseOrPromise instanceof Promise) {
            this.current = new NullLicense();
            licenseOrPromise.then(l => {
                this.current = l;
            });
        } else {
            this.current = licenseOrPromise;
        }
    }

    get(): ILicense {
        return this.current;
    }
}
