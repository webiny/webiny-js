export interface Input {
    type: string;
    name: string;
    packageName: string;
    location: string;
    dependencies?: string;
    templateArgs?: string;
}