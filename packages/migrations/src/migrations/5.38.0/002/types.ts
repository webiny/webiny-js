export type FbFormLayout = Array<Array<string>>;

export interface FbForm {
    id: string;
    formId: string;
    steps?: Array<{ title: string; layout: FbFormLayout }>;
    layout?: FbFormLayout;
    TYPE?: string;
}

export interface FbFormSubmission {
    tenant: string;
    locale: string;
    id: string;
    form: {
        steps?: Array<{ title: string; layout: FbFormLayout }>;
        layout?: FbFormLayout;
    };
}
