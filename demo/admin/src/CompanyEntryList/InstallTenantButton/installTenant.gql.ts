import gql from "graphql-tag";

export const INSTALL_TENANT = gql`
    mutation InstallCompanyTenant($companyId: ID!) {
        installCompanyTenant(companyId: $companyId) {
            data
            error {
                code
                message
                data
            }
        }
    }
`;

export interface InstallTenantResponse {
    installCompanyTenant: {
        data: boolean | null;
        error?: {
            code: string;
            message: string;
            data: Record<string, any>;
        };
    };
}
