// Global ambient declaration injected into Monaco's TypeScript language service.
//
// NOTE: This file contains TypeScript type declarations as a string literal.
// In the future, this can be auto-generated from a real .d.ts file.
//
// RULES (do not break these):
//   1. This string must contain NO top-level `import` or `export` statements.
//      Any import/export makes TypeScript treat the file as a module, scoping
//      all declarations locally instead of globally.
//   2. All types must be declared inline — no cross-file references.
//   3. Register this with addExtraLib using a "file:///" URI.

import { COMMON_DECLARATIONS } from "./declarations/common.js";
import { CMS_DECLARATIONS } from "./declarations/cms.js";
import { TENANT_MANAGER_DECLARATIONS } from "./declarations/tenantManager.js";
import { FILE_MANAGER_DECLARATIONS } from "./declarations/fileManager.js";
import { LANGUAGES_DECLARATIONS } from "./declarations/languages.js";

export const SDK_GLOBAL_DECLARATION = `
${COMMON_DECLARATIONS}

${CMS_DECLARATIONS}

${TENANT_MANAGER_DECLARATIONS}

${FILE_MANAGER_DECLARATIONS}

${LANGUAGES_DECLARATIONS}

// ============================================================================
// MAIN SDK INTERFACE
// ============================================================================

interface SdkWebiny {
    /** CMS operations: list, get, create, update, delete, publish entries. */
    readonly cms: SdkCms;

    /** Tenant Manager operations: create, install, disable, enable tenants. */
    readonly tenantManager: SdkTenantManager;

    /** File Manager operations: upload, list, get, update, delete files. */
    readonly fileManager: SdkFileManager;

    /** Languages operations: list enabled languages. */
    readonly languages: SdkLanguages;
}

declare const sdk: SdkWebiny;
declare interface Window { sdk: SdkWebiny; }
`;
