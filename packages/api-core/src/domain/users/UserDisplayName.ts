interface UserDisplayNameSource {
    id: string;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
}

/**
 * The name a user is shown by: the display name, then the first and last name, then the
 * e-mail address, then the user ID. Blank values are skipped.
 */
export class UserDisplayName {
    private constructor(private readonly value: string) {}

    static from(user: UserDisplayNameSource) {
        const displayName = user.displayName?.trim();
        if (displayName) {
            return new UserDisplayName(displayName);
        }

        const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        if (fullName) {
            return new UserDisplayName(fullName);
        }

        const email = user.email?.trim();
        if (email) {
            return new UserDisplayName(email);
        }

        return new UserDisplayName(user.id);
    }

    toString() {
        return this.value;
    }
}
