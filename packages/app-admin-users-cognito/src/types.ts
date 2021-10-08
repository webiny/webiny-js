import { BindComponent } from "@webiny/form";
import { SecurityPermission } from "@webiny/app-security/types";

export type SecurityViewProps = {
    Bind: BindComponent;
    data: { [key: string]: any };
};

export type Tenant = {
    id: string;
    name: string;
    group: string;
    permissions: SecurityPermission[];
};

export interface PasswordPolicy {
    minimumLength?: number;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    requireUppercase?: boolean;
}
