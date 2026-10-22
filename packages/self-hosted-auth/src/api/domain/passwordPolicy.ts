import { z } from "zod";

/**
 * The one rule a password has to pass before it is hashed and stored. Shared by every path that
 * sets one, so the admin forms and the installer cannot drift apart on it.
 */
export const passwordPolicy = z.string().min(8);
