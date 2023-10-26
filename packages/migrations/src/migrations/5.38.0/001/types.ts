export type FbFormLayout = Array<Array<string>>;

export interface FbForm {
    steps?: Array<{ title: string; layout: FbFormLayout }>;
    layout?: FbFormLayout;
}
