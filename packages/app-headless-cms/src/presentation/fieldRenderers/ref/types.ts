export interface RefFieldRendererSettings {
    models: Array<{ modelId: string; name?: string }>;
    [key: string]: unknown;
}

declare module "@webiny/app-admin/features/formModel/abstractions.js" {
    interface IFieldRendererRegistry {
        refDetailedSingle: { fieldType: "ref"; settings: RefFieldRendererSettings };
        refDetailedMultiple: { fieldType: "ref"; settings: RefFieldRendererSettings };
    }
}
