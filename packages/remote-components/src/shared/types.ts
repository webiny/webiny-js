export interface RemoteComponentDto {
    id: string;
    name: string;
    label: string;
    description: string;
    aiContext: string;
    source: string;
    css: string;
    bundledJs: string;
    bundledJsSha256: string;
    bundledCss: string;
    bundledCssSha256: string;
    aiPrompt: string;
    status: string;
    sdkVersion: string;
    createdOn: string;
    savedOn: string;
}
