export interface TenantValues {
    name: string;
    description: string;
    isInstalled: boolean;
    extensions: TenantExtensions;
}

export interface TenantExtensions {}

export interface TenantDto {
    id: string;
    values: TenantValues;
}

export const rootTenantDto: TenantDto = {
    id: "root",
    values: {
        name: "Root",
        isInstalled: true,
        description: "Platform Root",
        extensions: {}
    }
};

export class Tenant {
    private constructor(private dto: TenantDto) {}

    static from(dto: TenantDto) {
        return new Tenant(dto);
    }

    get id() {
        return this.dto.id;
    }

    get values() {
        return this.dto.values;
    }
}
