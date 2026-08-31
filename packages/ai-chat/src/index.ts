/*
 * Root surface: the contract shared by both sides of the feature. The approval types cross the wire,
 * so the admin client describes them with the same declarations the server produces rather than
 * redeclaring them. Types only — importing this pulls in no runtime code from either side.
 */
export type { PendingApproval } from "./api/approvals.js";
export type { ApprovalDecision } from "./api/approvals.js";
