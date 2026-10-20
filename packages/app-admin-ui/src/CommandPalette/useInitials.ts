import { useIdentity } from "@webiny/app-admin";

/** "Sven Al Hamad" is "SA". Falls back to the display name, then to nothing. */
const toInitials = (identity: ReturnType<typeof useIdentity>["identity"]): string => {
    const { firstName = "", lastName = "" } = identity?.profile ?? {};
    const name = `${firstName} ${lastName}`.trim() || identity?.displayName || "";

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
};

/** The signed-in user's initials, shown against each question they asked the assistant. */
export const useInitials = (): string => {
    const { identity } = useIdentity();
    return toInitials(identity);
};
