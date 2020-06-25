import security from "./security";
import { SecurityOptions } from "../types";

// TODO [Andrei]: add PAT & JWT authorization plugins here
export default (options: SecurityOptions) => [security(options)];
