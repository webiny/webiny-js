import { createAbstraction } from "@webiny/feature/admin";

export interface ICustomIcon {
    type: "custom";
    name: string;
    value: string;
}

export interface IListCustomIconsGateway {
    execute(): Promise<ICustomIcon[]>;
}

export const ListCustomIconsGateway = createAbstraction<IListCustomIconsGateway>(
    "IconPicker/ListCustomIconsGateway"
);

export namespace ListCustomIconsGateway {
    export type Interface = IListCustomIconsGateway;
}
