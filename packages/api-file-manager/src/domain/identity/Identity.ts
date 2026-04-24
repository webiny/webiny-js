interface IdentityDto {
    id: string;
    displayName: string;
    type: string;
}

export class Identity {
    static from(identity: IdentityDto): IdentityDto {
        return {
            id: identity.id,
            displayName: identity.displayName,
            type: identity.type
        };
    }
}
