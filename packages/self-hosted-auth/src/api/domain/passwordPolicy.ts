import { z } from "zod";
import { MINIMUM_PASSWORD_LENGTH } from "~/shared/passwordRules.js";

/**
 * The one rule a password has to pass before it is hashed and stored. Shared by every path that
 * sets one. The admin forms check the same length, from `MINIMUM_PASSWORD_LENGTH`.
 */
export const passwordPolicy = z.string().min(MINIMUM_PASSWORD_LENGTH);
