export interface UpdateRedirectParams {
    id: string;
    redirectFrom?: string;
    redirectTo?: string;
    redirectType?: string;
    isEnabled?: boolean;
}

export interface IUpdateRedirectUseCase {
    execute: (params: UpdateRedirectParams) => Promise<void>;
}
