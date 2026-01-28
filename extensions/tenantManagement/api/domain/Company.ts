export interface CompanyDto {
    id: string;
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

const rootCompanyDto: CompanyDto = {
    id: "root",
    name: "Root",
    isInstalled: true,
    description: "Platform Root",
    theme: {
        websiteTitle: "Your Company",
        primaryColor: "#fa5723",
        additionalColors: ["#00ccb0", "#0a0a0a", "#616161"],
        font: "Roboto"
    }
};

export class Company {
    static createRootCompany() {
        return Company.from(rootCompanyDto);
    }

    static from(dto: CompanyDto) {
        return new Company(dto);
    }

    private constructor(private readonly dto: CompanyDto) {}

    get id() {
        return this.dto.id;
    }

    get name() {
        return this.dto.name;
    }

    get isInstalled() {
        return this.dto.isInstalled;
    }

    get theme() {
        return this.dto.theme;
    }
}
