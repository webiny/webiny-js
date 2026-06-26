import { createAbstraction } from "@webiny/feature/admin";

export interface CustomIcon {
    type: string;
    name: string;
    value: string;
}

export interface IListCustomIconsUseCase {
    execute(): Promise<CustomIcon[]>;
}

export const ListCustomIconsUseCase = createAbstraction<IListCustomIconsUseCase>(
    "Admin/ListCustomIconsUseCase"
);

export namespace ListCustomIconsUseCase {
    export type Interface = IListCustomIconsUseCase;
    export type Result = CustomIcon[];
    export type Icon = CustomIcon;
}
