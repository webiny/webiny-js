import React from "react";
import { useIdentity } from "@webiny/app-admin";

/*
 * Up to two letters, from the profile's names when it has them. The display name is the fallback,
 * and is often an email address, so only the part before the "@" counts.
 */
const initialsOf = (names: Array<string | undefined>, displayName: string) => {
    let words = names.filter((name): name is string => !!name?.trim());
    if (words.length === 0) {
        const [local] = displayName.split("@");
        words = local.split(/[\s._-]+/).filter(Boolean);
    }

    return words
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
};

/** The signed-in user's initials, shown against each question they asked. */
export const UserInitials = () => {
    const { identity } = useIdentity();
    const { firstName, lastName } = identity.profile || {};
    const initials = initialsOf([firstName, lastName], identity.displayName);

    return (
        <span
            className="mt-xxs grid shrink-0 place-items-center rounded-xl bg-neutral-dimmed font-bold text-neutral-strong"
            style={{ width: 20, height: 20, fontSize: 9.5 }}
        >
            {initials}
        </span>
    );
};
