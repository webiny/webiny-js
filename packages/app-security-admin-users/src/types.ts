import { BindComponent } from "@webiny/form/Bind";
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
