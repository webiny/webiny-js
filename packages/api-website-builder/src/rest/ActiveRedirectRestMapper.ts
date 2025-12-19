import type { ActiveRedirectDto } from "./ActiveRedirectDto.js";
import type { WbRedirect } from "~/domain/redirect/abstractions.js";

export class ActiveRedirectRestMapper {
    static toDto(redirect: WbRedirect): ActiveRedirectDto {
        return {
            id: redirect.id,
            from: redirect.redirectFrom,
            to: redirect.redirectTo,
            permanent: redirect.redirectType === "permanent"
        };
    }
}
