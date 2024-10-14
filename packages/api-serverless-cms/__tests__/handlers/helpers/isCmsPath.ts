export interface IIsCmsPathParams {
    path: string;
}

export const isCmsPath = (params: IIsCmsPathParams): boolean => {
    return params.path.includes("/cms/");
};
