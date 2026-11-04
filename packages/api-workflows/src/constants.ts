export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment";
export const WORKFLOW_SETTINGS_MODEL_ID = "wbyWorkflowSettings";
/** The one settings entry of a tenant (CMS entries are tenant-scoped). */
export const WORKFLOW_SETTINGS_ENTRY_ID = "settings";
export const WORKFLOWS_PERMISSION = "workflows";

/** Review lists (R92): rows per call by default and at most. */
export const DEFAULT_REVIEW_LIST_LIMIT = 20;
export const MAX_REVIEW_LIST_LIMIT = 100;
/** Rows a list call examines at most; a call may return a short page with more to come (D76, A41). */
export const MAX_REVIEW_LIST_SCAN = 200;
/** Repository page size of the review lists; constant, so a list cursor's `skip` stays valid. */
export const REVIEW_LIST_PAGE_SIZE = 50;

/** The shared user list (R123): rows per call by default and at most. */
export const DEFAULT_USER_LIST_LIMIT = 50;
export const MAX_USER_LIST_LIMIT = 200;

/** The shared team list (R268): rows per call by default and at most; also the cap of `ids`. */
export const DEFAULT_TEAM_LIST_LIMIT = 50;
export const MAX_TEAM_LIST_LIMIT = 200;

/**
 * The feature flag of teams (R287). With it off no workflows code queries teams or returns team
 * data; each request reads it again through the api-core `FeatureFlags`, never at registration.
 */
export const TEAMS_FEATURE_FLAG = "advancedAccessControlLayer.teams";

/** How many candidate ids the routing inspector returns (R289); the count covers all of them. */
export const INSPECTION_CANDIDATE_LIMIT = 3;
