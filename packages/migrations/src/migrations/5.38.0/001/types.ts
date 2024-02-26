export type FbFormLayout = Array<Array<string>>;

export interface FbForm {
    id: string;
    formId: string;
    steps?: Array<{ title: string; layout: FbFormLayout }>;
    layout?: FbFormLayout;
    TYPE?: string;
}
