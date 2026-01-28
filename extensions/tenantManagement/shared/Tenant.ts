export interface TenantValues {
    name: string;
    description: string;
    theme: {
        websiteTitle: string;
        primaryColor: string;
        additionalColors: string[];
        font: string;
    };
    isInstalled: boolean;
}

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
        theme: {
            websiteTitle: "Your Company",
            primaryColor: "#fa5723",
            additionalColors: ["#00ccb0", "#0a0a0a", "#616161"],
            font: "Roboto"
        }
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
