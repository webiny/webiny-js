import { createImplementation } from "@webiny/di";
import type { DecryptedWcpProjectLicense } from "@webiny/wcp/types";
import { LocalStorageService, LoggerService, WcpService } from "~/abstractions/index.js";
import { GetUser } from "./GetUser.js";
import { GenerateUserPat } from "./GenerateUserPat.js";
import { GetUserPat } from "./GetUserPat.js";
import { CreateUserPat } from "~/services/WcpService/CreateUserPat.js";
import { UrlModel } from "~/models/index.js";
import { getWcpApiUrl, getWcpGqlApiUrl, getWcpAppUrl } from "@webiny/wcp";
import { StorePatToLocalStorage } from "~/services/WcpService/StorePatToLocalStorage.js";
import { UnsetPatFromLocalStorage } from "./UnsetPatFromLocalStorage.js";
import { GetProjectEnvironment } from "./GetProjectEnvironment.js";
import { GetProjectLicense } from "./GetProjectLicense.js";
import {
    IGetProjectEnvironmentParams,
    IGetProjectLicenseParams
} from "~/abstractions/services/WcpService.js";

export class DefaultWcpService implements WcpService.Interface {
    private cachedLicense: DecryptedWcpProjectLicense | null = null;

    constructor(
        private loggerService: LoggerService.Interface,
        private localStorageService: LocalStorageService.Interface
    ) {}

    async getUser() {
        const getUser = new GetUser({ localStorageService: this.localStorageService });
        return getUser.execute();
    }

    async generateUserPat() {
        const generateUserPat = new GenerateUserPat({
            loggerService: this.loggerService
        });
        return generateUserPat.execute();
    }

    async getUserPat(pat: string) {
        const getUserPat = new GetUserPat({
            loggerService: this.loggerService
        });
        return getUserPat.execute(pat);
    }

    async createUserPat(data: any, userPat: string) {
        const createUserPat = new CreateUserPat({
            loggerService: this.loggerService
        });
        return createUserPat.execute(data, userPat);
    }

    storePatToLocalStorage(pat: string) {
        const storePatToLocalStorage = new StorePatToLocalStorage({
            localStorageService: this.localStorageService
        });
        return storePatToLocalStorage.execute(pat);
    }

    unsetPatFromLocalStorage() {
        const unsetPatFromLocalStorage = new UnsetPatFromLocalStorage({
            localStorageService: this.localStorageService
        });
        return unsetPatFromLocalStorage.execute();
    }

    getWcpApiUrl() {
        return UrlModel.from(getWcpApiUrl());
    }
    getWcpGqlApiUrl() {
        return UrlModel.from(getWcpGqlApiUrl());
    }

    getWcpAppUrl() {
        return UrlModel.from(getWcpAppUrl());
    }

    getProjectEnvironment(params: IGetProjectEnvironmentParams) {
        const getProjectEnvironment = new GetProjectEnvironment({
            localStorageService: this.localStorageService
        });
        return getProjectEnvironment.execute(params);
    }

    async getProjectLicense(
        params: IGetProjectLicenseParams
    ): Promise<DecryptedWcpProjectLicense | null> {
        // Return cached license if available
        if (this.cachedLicense) {
            return this.cachedLicense;
        }

        const getProjectLicense = new GetProjectLicense({
            loggerService: this.loggerService
        });

        const decryptedLicense = await getProjectLicense.execute(params);

        // Cache and return the license (may be null if fetch failed)
        this.cachedLicense = decryptedLicense;
        return this.cachedLicense;
    }
}

export const wcpService = createImplementation({
    abstraction: WcpService,
    implementation: DefaultWcpService,
    dependencies: [LoggerService, LocalStorageService]
});
