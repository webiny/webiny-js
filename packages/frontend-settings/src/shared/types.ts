export interface IStarterKit {
    id: string;
    label: string;
    config: string;
}

export interface IFrontendSettings {
    domain: string;
    starterKits?: IStarterKit[];
}
