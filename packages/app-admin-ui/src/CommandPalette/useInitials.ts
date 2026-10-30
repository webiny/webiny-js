import { useIdentity } from "@webiny/app-admin";

/**
 * "Sven Al Hamad" is "S". One letter, as in the design: the circle is small, and a second letter
 * crowds it. Falls back to the display name, then to nothing.
 */
const toInitials = (identity: ReturnType<typeof useIdentity>["identity"]): string => {
    const { firstName = "", lastName = "" } = identity?.profile ?? {};
    const name = `${firstName} ${lastName}`.trim() || identity?.displayName || "";

    return name.charAt(0).toUpperCase();
};

/** The signed-in user's initial, shown against each question they asked the assistant. */
export const useInitials = (): string => {
    const { identity } = useIdentity();
    return toInitials(identity);
};
