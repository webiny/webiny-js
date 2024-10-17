import { ICreateMutationCb, ICreateQueryCb, MutationBody } from "../helpers/factory/types";

/**
 * Queries
 */
const createIsSecurityInstalled = () => {
    return `
        query IsSecurityInstalled {
            security {
                version
            }
        }
    `;
};
const createIsTenancyInstalled = () => {
    return `
        query IsTenancyInstalled {
            tenancy {
                version
            }
        }
    `;
};

const createIsLocaleInstalled = () => {
    return `
        query IsLocaleInstalled {
            i18n {
                version
            }
        }
    `;
};

const createIsAdminUsersInstalled = () => {
    return `
        query IsAdminUsersInstalled {
            adminUsers {
                version
            }
        }
    `;
};

const createIsHeadlessCmsInstalled = () => {
    return `
        query IsHeadlessCmsInstalled {
            cms {
                version
            }
        }
    `;
};

const createIsPageBuilderInstalled = () => {
    return `
        query IsPageBuilderInstalled {
            pageBuilder {
                version
            }
        }
    `;
};

const createIsFormBuilderInstalled = () => {
    return `
        query IsFormBuilderInstalled {
            formBuilder {
                version
            }
        }
    `;
};

/**
 * Mutations
 */

const createInstallSecurityMutation = (): MutationBody => {
    return `mutation InstallSecurity {
            security {
                install {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

const createInstallTenancyMutation = (): MutationBody => {
    return `mutation InstallTenancy {
            tenancy {
                install {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

const createInstallAdminUsersMutation = (): MutationBody => {
    return `mutation InstallAdminUsers {
            adminUsers {
                install {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

export interface IInstallI18NVariables {
    data: {
        code: string;
    };
}

const createInstallI18NMutation = (): MutationBody => {
    return `mutation InstallLocale($data: I18NInstallInput!) {
            i18n {
                install(data: $data) {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

const createInstallHeadlessCmsMutation = (): MutationBody => {
    return `mutation InstallHeadlessCms {
            cms {
                install {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

export interface IInstallPageBuilderVariables {
    data: {
        insertDemoData: boolean;
        websiteUrl: string;
        name: string;
    };
}

const createInstallPageBuilderMutation = (): MutationBody => {
    return `mutation InstallPageBuilder($data: PbInstallInput!) {
            pageBuilder {
                install(data: $data) {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

const createInstallFormBuilderMutation = (): MutationBody => {
    return `mutation InstallFormBuilder {
            formBuilder {
                install {
                    data
                    error {
                        message
                        code
                        data
                        stack
                    }
                }
            }
        }
    `;
};

export interface ICreateInstallGraphQlParams {
    createQuery: ICreateQueryCb;
    createMutation: ICreateMutationCb;
}

export const createInstallGraphQL = (params: ICreateInstallGraphQlParams) => {
    const { createQuery, createMutation } = params;

    return {
        /**
         * Is Installed Queries
         */
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
        }),
        /**
         * Install Mutations
         */
        installSecurity: createMutation({
            mutation: createInstallSecurityMutation()
        }),
        installTenancy: createMutation({
            mutation: createInstallTenancyMutation()
        }),
        installAdminUsers: createMutation({
            mutation: createInstallAdminUsersMutation()
        }),
        installI18N: createMutation<IInstallI18NVariables>({
            mutation: createInstallI18NMutation()
        }),
        installHeadlessCms: createMutation({
            mutation: createInstallHeadlessCmsMutation()
        }),
        installPageBuilder: createMutation<IInstallPageBuilderVariables>({
            mutation: createInstallPageBuilderMutation()
        }),
        installFormBuilder: createMutation({
            mutation: createInstallFormBuilderMutation()
        })
    };
};
