export interface CompanyValues {
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

export interface CompanyDto {
    id: string;
    values: CompanyValues;
}

export const rootCompanyDto: CompanyDto = {
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

export class Company {
    private constructor(private dto: CompanyDto) {}

    static from(dto: CompanyDto) {
        return new Company(dto);
    }

    get id() {
        return this.dto.id;
    }

    get values() {
        return this.dto.values;
    }
}
