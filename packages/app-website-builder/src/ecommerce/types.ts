export type Image = {
    width?: number;
    height?: number;
    src: string;
};

export type Resource = {
    id: string | number;
    title: string;
    handle?: string;
    image?: Image;
};

export interface IEcommerceApi {
    [resourceName: string]: {
        findById(id: string): Promise<Resource>;
        findByHandle?(handle: string): Promise<Resource>;
        search(search: string, offset?: number, limit?: number): Promise<Resource[]>;
        getRequestObject(id: string, resource?: Resource): string;
    };
}

export interface IEcommerceApiFactory {
    (settings: any): Promise<IEcommerceApi> | IEcommerceApi;
}
