import { z } from "zod";

/*
 * The sidebar groups a stored menu may nest under. A parent that does not exist hides the item and
 * nothing reports it, so the list is closed rather than free text.
 */
export const MENU_PARENTS = [
    "settings",
    "settings.system",
    "settings.security",
    "headlessCMS",
    "wb",
    "dev-tools"
] as const;

/**
 * What a stored menu's `source` holds. Shared by the API, which validates it before saving, and the
 * admin, which parses it again before rendering: a hand-edited entry is the one way past the first
 * check, and a malformed one must not take the sidebar down.
 */
export const MenuSourceSchema = z
    .object({
        label: z.string().trim().min(1).max(64),
        /*
         * An admin path. A full URL or a protocol-relative one would turn the sidebar into a way out,
         * and so would a backslash, which browsers read as a slash (`/\example.com`).
         */
        to: z
            .string()
            .regex(
                /^\/(?![/\\])[^\s\\]*$/,
                "Use an admin path starting with a single slash, e.g. /cms."
            ),
        parent: z.enum(MENU_PARENTS).nullable(),
        pinnable: z.boolean()
    })
    .strict();

export type MenuSource = z.infer<typeof MenuSourceSchema>;
