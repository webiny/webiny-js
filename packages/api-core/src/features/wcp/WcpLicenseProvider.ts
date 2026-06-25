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
 * The swap always completes before any GraphQL resolver runs.
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
