import { useForm } from "@webiny/form";
import { useAuthentication } from "@webiny/app-admin";
import type { FieldRule } from "~/types/model.js";
import { evaluateExpression, resolveFieldPath } from "./evaluateExpression.js";
import { useParentRules } from "./FieldRulesProvider.js";
import { useBindParentName } from "./useBind.js";

export interface EffectiveFieldRules {
    canView: boolean;
    canEdit: boolean;
    hidden: boolean;
    disabled: boolean;
}

interface HasRules {
    rules?: FieldRule[];
}

interface IdentityLike {
    id: string;
    teams: { slug: string }[];
}

/**
 * Evaluate access control rules against an identity.
 * Pure function — no hooks, can be called anywhere.
 */
function evaluateAccessControlRulesForIdentity(
    rules: FieldRule[],
    identity: IdentityLike
): Pick<EffectiveFieldRules, "canView" | "canEdit"> {
    const userTargets = new Set<string>();
    userTargets.add(`admin:${identity.id}`);
    for (const team of identity.teams) {
        userTargets.add(`team:${team.slug}`);
    }

    let canView = true;
    let canEdit = true;

    for (const rule of rules) {
        if (rule.type !== "accessControl") {
            continue;
        }
        if (!rule.value || !rule.operator) {
            continue;
        }
        if (!userTargets.has(String(rule.value))) {
            continue;
        }
        if (rule.action === "hide") {
            canView = false;
        } else if (rule.action === "disable") {
            canEdit = false;
        }
    }

    return { canView, canEdit };
}

/**
 * Hook that evaluates access control rules for the current identity.
 * Does not require `bindParentName` — only identity-based permissions.
 */
export function useFieldAccessControlRules(
    item: HasRules
): Pick<EffectiveFieldRules, "canView" | "canEdit"> {
    const { identity } = useAuthentication();

    const rules = item.rules;
    if (!rules || rules.length === 0) {
        return { canView: true, canEdit: true };
    }

    return evaluateAccessControlRulesForIdentity(rules, identity);
}

/**
 * Evaluate access control rules statically (without hooks).
 * Used in RowRenderer for the visibility approximation where hooks can't be called.
 */
export function evaluateAccessControlRules(
    item: HasRules,
    identity: IdentityLike
): EffectiveFieldRules {
    const rules = item.rules;
    if (!rules || rules.length === 0) {
        return { canView: true, canEdit: true, hidden: false, disabled: false };
    }

    const { canView, canEdit } = evaluateAccessControlRulesForIdentity(rules, identity);
    return { canView, canEdit, hidden: false, disabled: false };
}

/**
 * Internal hook that evaluates all rules (access control + entry value).
 */
function useFieldRules(item: HasRules): EffectiveFieldRules {
    const { identity } = useAuthentication();
    const form = useForm();
    const bindParentName = useBindParentName();

    const rules = item.rules;
    if (!rules || rules.length === 0) {
        return { canView: true, canEdit: true, hidden: false, disabled: false };
    }

    const { canView, canEdit } = evaluateAccessControlRulesForIdentity(rules, identity);

    let hidden = false;
    let disabled = false;

    for (const rule of rules) {
        if (rule.type !== "condition") {
            continue;
        }
        if (!rule.target || !rule.operator) {
            continue;
        }
        const resolvedPath = resolveFieldPath(rule.target, bindParentName);
        const matches = evaluateExpression(
            { target: resolvedPath, operator: rule.operator as any, value: rule.value },
            name => form.getValue(name)
        );
        if (!matches) {
            continue;
        }
        if (rule.action === "hide") {
            hidden = true;
        } else if (rule.action === "disable") {
            disabled = true;
        }
    }

    return { canView, canEdit, hidden, disabled };
}

/**
 * Composes useParentRules and useFieldRules into a single hook
 * that returns the effective (intersected) rules.
 */
export function useEffectiveRules(item: HasRules): EffectiveFieldRules {
    const parentRules = useParentRules();
    const itemRules = useFieldRules(item);
    return {
        canView: parentRules.canView && itemRules.canView,
        canEdit: parentRules.canEdit && itemRules.canEdit,
        hidden: parentRules.hidden || itemRules.hidden,
        disabled: parentRules.disabled || itemRules.disabled
    };
}
