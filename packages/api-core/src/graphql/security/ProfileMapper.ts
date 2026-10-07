import type { AdminUser } from "~/types/users.js";

interface IdentityProfile {
    firstName: string;
    lastName: string;
    email?: string;
    avatar?: {
        id: string;
        src: string;
    } | null;
    external: boolean;
    createdOn: string;
}

export class ProfileMapper {
    async toDTO(user: AdminUser): Promise<IdentityProfile> {
        return {
            firstName: user.firstName ?? "",
            lastName: user.lastName ?? "",
            email: user.email ?? null,
            avatar: user.avatar,
            external: user.external ?? false,
            createdOn: user.createdOn
        };
    }
}
