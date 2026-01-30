export interface IdentityProfile {
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
