import security from "./security";
import { SecurityOptions } from "../types";

export default (options: SecurityOptions) => [security(options)];
