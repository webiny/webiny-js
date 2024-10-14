import { ICreateQueryCb } from "../helpers/query/types";

export const createIsSecurityInstalled = () => {
    return `
        query IsSecurityInstalled {
            security {
                version
            }
        }
    `;
};
export const createIsTenancyInstalled = () => {
    return `
        query IsTenancyInstalled {
            tenancy {
                version
            }
        }
    `;
};

export const createIsLocaleInstalled = () => {
    return `
        query IsLocaleInstalled {
            i18n {
                version
            }
        }
    `;
};

export const createIsAdminUsersInstalled = () => {
    return `
        query IsAdminUsersInstalled {
            adminUsers {
                version
            }
        }
    `;
};

export const createIsHeadlessCmsInstalled = () => {
    return `
        query IsHeadlessCmsInstalled {
            cms {
                version
            }
        }
    `;
};

export const createIsPageBuilderInstalled = () => {
    return `
        query IsPageBuilderInstalled {
            pageBuilder {
                version
            }
        }
    `;
};

export const createIsFormBuilderInstalled = () => {
    return `
        query IsFormBuilderInstalled {
            formBuilder {
                version
            }
        }
    `;
};

export const createInstallGraphQL = (createQuery: ICreateQueryCb) => {
    return {
        isSecurityInstalled: createQuery({
            query: createIsSecurityInstalled()
        }),
        isTenancyInstalled: createQuery({
            query: createIsTenancyInstalled()
        }),
        isAdminUsersInstalled: createQuery({
            query: createIsAdminUsersInstalled()
        }),
        isLocaleInstalled: createQuery({
            query: createIsLocaleInstalled()
        }),
        isHeadlessCmsInstalled: createQuery({
            query: createIsHeadlessCmsInstalled()
        }),
        isPageBuilderInstalled: createQuery({
            query: createIsPageBuilderInstalled()
        }),
        isFormBuilderInstalled: createQuery({
            query: createIsFormBuilderInstalled()
        })
    };
};
