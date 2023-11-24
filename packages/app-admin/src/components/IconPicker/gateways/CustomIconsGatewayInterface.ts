import { Icon } from "./customIcons.types";

export interface CustomIconsGatewayInterface {
    listCustomIcons: () => Promise<Icon[]>;
}
