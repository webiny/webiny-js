import type { Redirect } from "./Redirect.js";
import { ListCache } from "~/shared/cache/ListCache";

export const redirectListCache = new ListCache<Redirect>("id");
