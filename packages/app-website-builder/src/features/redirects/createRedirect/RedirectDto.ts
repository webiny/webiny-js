import type { WbLocation } from "~/types.js";

export interface RedirectDto {
    location: WbLocation;
    redirectFrom: string;
    redirectTo: string;
    redirectType: string;
    isEnabled: boolean;
}
