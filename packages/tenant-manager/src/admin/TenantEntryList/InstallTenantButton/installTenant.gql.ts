import gql from "graphql-tag";

export const INSTALL_TENANT = gql`
    mutation InstallTenant($tenantId: ID!) {
        tenantManager {
            installTenant(tenantId: $tenantId) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

export interface InstallTenantResponse {
    tenantManager: {
        installTenant:
            | {
                  data: boolean;
                  error?: null;
              }
            | {
                  data: null;
                  error: {
                      code: string;
                      message: string;
                      data: Record<string, any>;
                  };
              };
    };
}
