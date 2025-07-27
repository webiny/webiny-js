export interface ICreateSystemNameParams {
    env: string;
    variant: string | undefined;
}

export const createSystemName = (params: ICreateSystemNameParams): string => {
    return [params.env, params.variant].filter(Boolean).join("#");
};
