import fs from "node:fs";
import path from "node:path";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import * as barrel from "~/index.js";

const srcDir = import.meta.dirname;

/*
 * The names the admin layers refactor removed (R358): the use-case bundles, their interfaces and
 * fakes, the per-app bundle tokens, the review bridges, the old app kind and the old file paths.
 * This file is the only one allowed to spell them.
 */
const REMOVED_BUNDLE_PATTERN =
    /IReviewUseCases|IReviewReadUseCases|IReviewActionUseCases|IReviewListUseCases|IReviewCancelForDeleteUseCases|\bReviewUseCases\b|CmsReviewUseCases|WbReviewUseCases|IWorkflowConfigUseCases|WorkflowConfigUseCases|IWorkflowSettingsUseCases|WorkflowSettingsUseCases|IWorkflowEditorUseCases|WorkflowEditorUseCases|CmsWorkflowEditorUseCases|WbWorkflowEditorUseCases|createFakeUseCases|createFakeEditorUseCases|createFakeConfigUseCases|createFakeSettingsUseCases|CmsReviewAppGateway|WbReviewAppGateway|WorkflowEditorAppKind|editor\/useCases\/toOperationError|review\/gateway\/IReviewGateway/;

// The old review code (R219), the old editor API and the removed permissions API (R334): the files
// that once carried them must not again.
const OLD_CODE_PATTERN = /WorkflowState|workflowState|domain\/events|~\/routes\.js/;

const SHARED_FILES = ["app.tsx", "index.tsx", "types.ts"];

const OLD_EDITOR_API_PATTERN =
    /\bComponents\b|useCanUseWorkflows|IWorkflowApplication|\bWorkflowsFeature\b|WorkflowsEditorPresenterFeature|IGenericMeta|IGenericError|IWorkflowNotificationType|IWorkflowStep\b|IWorkflow\b/;

const PERMISSION_FILES = [
    "app.tsx",
    "index.tsx",
    "presentation/permissions/index.tsx",
    "presentation/permissions/SecurityPermissions.tsx"
];

const REMOVED_PERMISSION_API_PATTERN =
    /WorkflowsPermissionsFeature|HasWorkflowsEditorPermission|IHasWorkflowsSecurityPermissionProps|WORKFLOWS_PERMISSIONS_SCHEMA|permissionsSchema|features\/permissions/;

const SOURCE_FILE_PATTERN = /\.tsx?$/;

const THIS_FILE = "app.cleanup.test.tsx";

// Every `.ts` and `.tsx` file under `src`, relative to it, except this test.
const listSourceFiles = (): string[] => {
    const entries = fs.readdirSync(srcDir, { recursive: true, encoding: "utf-8" });
    return entries.filter(entry => SOURCE_FILE_PATTERN.test(entry) && entry !== THIS_FILE);
};

describe("app-workflows cleanup", () => {
    it("exports only WorkflowsAdminApp from the barrel (R334)", () => {
        const exportedNames = Object.keys(barrel).sort();

        expect(exportedNames).toEqual(["WorkflowsAdminApp"]);
    });

    it("no source file names a removed use-case bundle, fake or bridge (R358)", () => {
        const offenders = listSourceFiles().filter(relativePath => {
            const filePath = path.join(srcDir, relativePath);
            const source = fs.readFileSync(filePath, "utf-8");
            return REMOVED_BUNDLE_PATTERN.test(source);
        });

        expect(offenders).toEqual([]);
    });

    it.each(PERMISSION_FILES)("%s uses no removed permissions API (R334)", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(REMOVED_PERMISSION_API_PATTERN);
    });

    it.each(SHARED_FILES)("%s mentions no old review code", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_CODE_PATTERN);
    });

    it.each(SHARED_FILES)("%s carries no old editor API", relativePath => {
        const source = fs.readFileSync(path.join(srcDir, relativePath), "utf-8");

        expect(source).not.toMatch(OLD_EDITOR_API_PATTERN);
    });
});
