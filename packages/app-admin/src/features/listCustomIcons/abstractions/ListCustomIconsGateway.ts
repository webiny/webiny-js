import { createAbstraction } from "@webiny/feature/admin";

export interface CustomIconDto {
    name: string;
    src: string;
}

export interface IListCustomIconsGateway {
    execute(): Promise<CustomIconDto[]>;
}

export const ListCustomIconsGateway = createAbstraction<IListCustomIconsGateway>(
    "Admin/ListCustomIconsGateway"
);

export namespace ListCustomIconsGateway {
    export type Interface = IListCustomIconsGateway;
    export type Result = CustomIconDto[];
    export type Dto = CustomIconDto;
}
