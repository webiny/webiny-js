export interface IEcommerceSettings {
    [key: string]: any;
}

export interface IGetEcommerceSettings {
    execute(name: string): Promise<IEcommerceSettings | undefined>;
}
