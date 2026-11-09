import { registerExtensionImplementation } from "@webiny/project/extensions/hosting/index.js";
import { Encryption as EncryptionSpec } from "@webiny/project/extensions/index.js";
import { Hashing as HashingSpec } from "@webiny/project/extensions/index.js";
import { Encryption } from "./Encryption.js";
import { Hashing } from "./Hashing.js";

/*
 * The shared `Infra.Crypto.Encryption` and `Infra.Crypto.Hashing` (exported through
 * `webiny/extensions`) pass the secrets as build params. A standalone API reads them from env vars
 * when it starts, so standalone projects render the components below instead. `ProjectStandalone.tsx`
 * imports this module, so it runs before any project config renders.
 */
registerExtensionImplementation("standalone", EncryptionSpec, Encryption);
registerExtensionImplementation("standalone", HashingSpec, Hashing);
