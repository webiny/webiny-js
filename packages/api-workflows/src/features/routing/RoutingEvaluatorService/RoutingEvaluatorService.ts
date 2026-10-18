import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { AssignmentDecision } from "~/domain/assignment/types.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";
import type { WorkflowExclusion } from "~/domain/settings/types.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import {
    ROUTING_NO_CANDIDATE_REASON,
    ROUTING_SKIP_REASONS,
    ROUTING_TEAM_TARGET_SKIP_REASON,
    type RoutingSkipReason
} from "~/domain/routing/reasons.js";
import type {
    RoutingDirectoryUser,
    RoutingMember,
    RoutingRuleFacts,
    RoutingRuleLocalFacts,
    RoutingSkippedUser,
    RoutingTraceEntry
} from "~/domain/routing/types.js";
import { getFailedRoutingConditions } from "~/domain/routing/getFailedRoutingConditions.js";
import { getNamespaceModelId } from "~/domain/routing/getNamespaceModelId.js";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { listNotEvaluatedTrace } from "~/domain/routing/listNotEvaluatedTrace.js";
import { listRoutingCandidates } from "~/domain/routing/listRoutingCandidates.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import { matchRoutingRuleLocalConditions } from "~/domain/routing/matchRoutingRuleLocalConditions.js";
import { toRoutingEvaluation } from "~/domain/routing/toRoutingEvaluation.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/abstractions.js";
import { ReviewTargetReadAccess } from "~/features/review/ReviewTargetReadAccess/abstractions.js";
import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/abstractions.js";
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/abstractions.js";
import { RoutingEvaluatorService as Abstraction } from "./abstractions.js";

class RoutingEvaluatorServiceImpl implements Abstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private getSettings: GetWorkflowSettingsUseCase.Interface,
        private readAccesses: ReviewTargetReadAccess.Interface[],
        private folderChains: ReviewTargetFolderChain.Interface[],
        private strategies: RoutingStrategyService.Interface
    ) {}

    public async evaluate(params: Abstraction.EvaluateParams): Abstraction.EvaluateReturn {
        const { config } = params;
        const strategy = config.assignment.strategy;
        const rules = config.assignment.rules;
        // Inspector mode (R289); live assignment stays lazy.
        const explain = params.explain === true;
        const skips: AssignmentDecision[] = [];
        const trace: RoutingTraceEntry[] = [];
        // The skipped people for the inspector, with the exclusion's own reason (R129).
        const skipped: RoutingSkippedUser[] = [];
        // One read check per namespace; the last registered match wins, none means no access.
        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;
        const pickedUserId = config.assignment.allowManualPick ? params.pickedUserId : null;

        // Members of the step's teams and the active exclusions, read once when a pick, a user
        // target or a strategy needs them (R111).
        let members: RoutingDirectoryUser[] = [];
        let exclusions: WorkflowExclusion[] = [];
        const needsMembers =
            Boolean(pickedUserId) ||
            strategy !== "none" ||
            rules.some(rule => rule.target.type === "user");
        if (needsMembers && config.teams.length > 0) {
            // Listing users needs `adminUsers.user`: a membership lookup, read as the system
            // (D48). Only this call; the read checks below run as the request identity (SEC-66).
            const listed = await this.identityContext.withoutAuthorization(() => {
                return this.listUsers.execute({ where: { teams_in: [...config.teams] } });
            });
            if (listed.isFail()) {
                return Result.fail(
                    new RoutingDependencyError(listed.error, {
                        candidateTeamIds: config.teams,
                        ruleId: null,
                        skips
                    })
                );
            }
            members = listed.value.filter(user => {
                return config.teams.some(teamId => user.teams?.includes(teamId));
            });
            const settings = await this.getSettings.execute({ includeExpired: true });
            if (settings.isFail()) {
                return Result.fail(
                    new RoutingDependencyError(settings.error, {
                        candidateTeamIds: config.teams,
                        ruleId: null,
                        skips
                    })
                );
            }
            exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        }
        const memberIds = members.map(member => member.id);

        // 1. The requester's pick (spec 6, R110).
        if (pickedUserId) {
            const member = members.find(item => item.id === pickedUserId);
            let reason: RoutingSkipReason | null = getRoutingUserSkipReason({
                userId: pickedUserId,
                requesterId: params.requesterId,
                memberIds,
                exclusions
            });
            if (!reason && member) {
                const canRead = !readAccess
                    ? false
                    : params.read.type === "target"
                      ? await readAccess.canUserRead({
                            userId: member.id,
                            model: params.model,
                            targetId: params.read.targetId,
                            targetRevisionId: params.read.targetRevisionId
                        })
                      : await readAccess.canUserReadInFolder({
                            userId: member.id,
                            model: params.model,
                            folderId: params.read.folderId
                        });
                if (canRead) {
                    return Result.ok(
                        toRoutingEvaluation({
                            owner: { id: member.id, displayName: member.displayName },
                            source: "picked",
                            ruleId: null,
                            strategy,
                            candidateTeamIds: [...config.teams],
                            reason: null,
                            skips,
                            trace,
                            skipped
                        })
                    );
                }
                reason = ROUTING_SKIP_REASONS.cannotRead;
            }
            const pickReason = reason ?? ROUTING_SKIP_REASONS.notMember;
            skips.push({
                kind: "skip",
                userId: pickedUserId,
                source: "picked",
                ruleId: null,
                by: null,
                reason: pickReason
            });
            // The inspector shows the exclusion's own reason; the record keeps the fixed one
            // (R129, D89, D97).
            skipped.push({
                userId: pickedUserId,
                displayName: member?.displayName ?? null,
                reason:
                    pickReason === ROUTING_SKIP_REASONS.excluded
                        ? exclusions.find(item => item.userId === pickedUserId)?.reason ||
                          pickReason
                        : pickReason
            });
        }

        // 2. Rules, in order: the first whose conditions match and whose target is valid (R110).
        let candidateTeamIds = [...config.teams];
        let ruleId: string | null = null;
        // The index of a team rule that narrowed the candidates; the rules after it are listed as
        // not evaluated in inspector mode (R289).
        let decidedIndex = -1;
        if (rules.length > 0) {
            // Read lazily, on the first rule that needs them, and at most once: an earlier rule
            // decides without these lookups.
            let requesterTeamIds: string[] | null = null;
            let folderChainIds: string[] | null = null;
            const modelId = getNamespaceModelId(params.model);

            for (const [ruleIndex, rule] of rules.entries()) {
                // The conditions that need no lookup first: a live rule that fails them reads
                // neither the requester's teams nor the folder chain. The inspector goes on and
                // reads them, so it can name every failed condition (R289).
                const localFacts: RoutingRuleLocalFacts = {
                    requesterId: params.requesterId,
                    modelId,
                    folder: params.folder
                };
                const localMatch = matchRoutingRuleLocalConditions(rule.conditions, localFacts);
                if (!explain && !localMatch) {
                    trace.push({ ruleId: rule.id, outcome: "notMatched", reason: null });
                    continue;
                }
                if (rule.conditions.requesterTeamId && requesterTeamIds === null) {
                    // Runs as the system itself; a failure or an API key requester has no teams
                    // (R113).
                    const teams = await this.listUserTeams.execute(params.requesterId);
                    requesterTeamIds = teams.isOk() ? teams.value.map(team => team.id) : [];
                }
                const folderCondition = rule.conditions.folder;
                if (
                    folderCondition &&
                    params.folder &&
                    folderCondition.type === params.folder.type &&
                    folderChainIds === null
                ) {
                    const folderChain = [...this.folderChains]
                        .reverse()
                        .find(item => item.canHandle(params.model));
                    if (!folderChain) {
                        return Result.fail(
                            new RoutingDependencyError(
                                new Error(`No folder chain is registered for "${params.model}".`),
                                { candidateTeamIds: config.teams, ruleId: null, skips }
                            )
                        );
                    }
                    // The port throws when the folders cannot be read: caught here so the
                    // failure keeps the skips gathered so far (R116).
                    try {
                        folderChainIds = await folderChain.listFolderChainIds({
                            model: params.model,
                            folderId: params.folder.id
                        });
                    } catch (error) {
                        return Result.fail(
                            new RoutingDependencyError(
                                error instanceof Error ? error : new Error(String(error)),
                                { candidateTeamIds: config.teams, ruleId: null, skips }
                            )
                        );
                    }
                }
                const facts: RoutingRuleFacts = {
                    ...localFacts,
                    requesterTeamIds: requesterTeamIds ?? [],
                    folderChainIds: folderChainIds ?? []
                };
                if (!matchRoutingRuleConditions(rule.conditions, facts)) {
                    const notMatched: RoutingTraceEntry = {
                        ruleId: rule.id,
                        outcome: "notMatched",
                        reason: null
                    };
                    if (explain) {
                        notMatched.failedConditions = getFailedRoutingConditions(
                            rule.conditions,
                            facts
                        );
                    }
                    trace.push(notMatched);
                    continue;
                }
                if (rule.target.type === "team") {
                    // A team target outside the step's teams is not valid (spec 6): the rule is
                    // skipped and evaluation continues. Save-time validation refuses it; unsaved
                    // config can carry it.
                    if (!config.teams.includes(rule.target.id)) {
                        trace.push({
                            ruleId: rule.id,
                            outcome: "skipped",
                            reason: ROUTING_TEAM_TARGET_SKIP_REASON
                        });
                        skips.push({
                            kind: "skip",
                            userId: null,
                            source: "rule",
                            ruleId: rule.id,
                            by: null,
                            reason: ROUTING_TEAM_TARGET_SKIP_REASON
                        });
                        continue;
                    }
                    // A team target narrows the candidates; the strategy picks among them (R109).
                    trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                    ruleId = rule.id;
                    candidateTeamIds = [rule.target.id];
                    decidedIndex = ruleIndex;
                    break;
                }
                const targetId = rule.target.id;
                const member = members.find(item => item.id === targetId);
                let reason: RoutingSkipReason | null = getRoutingUserSkipReason({
                    userId: targetId,
                    requesterId: params.requesterId,
                    memberIds,
                    exclusions
                });
                if (!reason && member) {
                    const canRead = !readAccess
                        ? false
                        : params.read.type === "target"
                          ? await readAccess.canUserRead({
                                userId: member.id,
                                model: params.model,
                                targetId: params.read.targetId,
                                targetRevisionId: params.read.targetRevisionId
                            })
                          : await readAccess.canUserReadInFolder({
                                userId: member.id,
                                model: params.model,
                                folderId: params.read.folderId
                            });
                    if (canRead) {
                        trace.push({ ruleId: rule.id, outcome: "matched", reason: null });
                        if (explain) {
                            const notEvaluated = listNotEvaluatedTrace(rules, ruleIndex + 1);
                            trace.push(...notEvaluated);
                        }
                        return Result.ok(
                            toRoutingEvaluation({
                                owner: { id: member.id, displayName: member.displayName },
                                source: "rule",
                                ruleId: rule.id,
                                strategy,
                                candidateTeamIds: [...config.teams],
                                reason: null,
                                skips,
                                trace,
                                skipped
                            })
                        );
                    }
                    reason = ROUTING_SKIP_REASONS.cannotRead;
                }
                const skipReason = reason ?? ROUTING_SKIP_REASONS.notMember;
                // The editor sees the exclusion's own reason in the trace; the record keeps the
                // fixed one (R129, D89, D97).
                const shownReason =
                    skipReason === ROUTING_SKIP_REASONS.excluded
                        ? exclusions.find(item => item.userId === targetId)?.reason || skipReason
                        : skipReason;
                trace.push({ ruleId: rule.id, outcome: "skipped", reason: shownReason });
                skipped.push({
                    userId: targetId,
                    displayName: member?.displayName ?? null,
                    reason: shownReason
                });
                skips.push({
                    kind: "skip",
                    userId: targetId,
                    source: "rule",
                    ruleId: rule.id,
                    by: null,
                    reason: skipReason
                });
            }
        }

        // The rules after a team rule that decided were not evaluated (R289).
        if (explain && decidedIndex >= 0) {
            const notEvaluated = listNotEvaluatedTrace(rules, decidedIndex + 1);
            trace.push(...notEvaluated);
        }

        // 3. The strategy over the candidates, then 4. the pool (R110).
        if (strategy === "none") {
            return Result.ok(
                toRoutingEvaluation({
                    owner: null,
                    source: "pool",
                    ruleId,
                    strategy,
                    candidateTeamIds,
                    reason: null,
                    skips,
                    trace,
                    skipped
                })
            );
        }
        const candidates = listRoutingCandidates({
            members,
            candidateTeamIds,
            requesterId: params.requesterId,
            exclusions
        });
        // The strategy decides who is asked first (R115).
        const ordered = await this.strategies.order({
            strategy,
            candidates,
            model: params.model,
            workflowId: params.workflowId,
            reviewId: params.reviewId,
            stepId: params.stepId
        });
        if (ordered.isFail()) {
            // Keep what was decided: the narrowed teams, the rule and the skips (R116).
            return Result.fail(
                new RoutingDependencyError(ordered.error, { candidateTeamIds, ruleId, skips })
            );
        }
        // The inspector shows the order the strategy considers (R289).
        const strategyOrder = explain ? ordered.value : undefined;
        // Read access is checked lazily in strategy order, stopping at the first readable
        // candidate (R111, A47).
        for (const candidate of ordered.value) {
            const canRead = !readAccess
                ? false
                : params.read.type === "target"
                  ? await readAccess.canUserRead({
                        userId: candidate.id,
                        model: params.model,
                        targetId: params.read.targetId,
                        targetRevisionId: params.read.targetRevisionId
                    })
                  : await readAccess.canUserReadInFolder({
                        userId: candidate.id,
                        model: params.model,
                        folderId: params.read.folderId
                    });
            if (canRead) {
                return Result.ok(
                    toRoutingEvaluation({
                        owner: candidate,
                        source: strategy,
                        ruleId,
                        strategy,
                        candidateTeamIds,
                        reason: null,
                        skips,
                        trace,
                        skipped,
                        strategyOrder
                    })
                );
            }
            skips.push({
                kind: "skip",
                userId: candidate.id,
                source: strategy,
                ruleId,
                by: null,
                reason: ROUTING_SKIP_REASONS.cannotRead
            });
            skipped.push({
                userId: candidate.id,
                displayName: candidate.displayName,
                reason: ROUTING_SKIP_REASONS.cannotRead
            });
        }
        return Result.ok(
            toRoutingEvaluation({
                owner: null,
                source: "pool",
                ruleId,
                strategy,
                candidateTeamIds,
                reason: ROUTING_NO_CANDIDATE_REASON,
                skips,
                trace,
                skipped,
                strategyOrder
            })
        );
    }

    public async listMembers(params: Abstraction.MembersParams): Abstraction.MembersReturn {
        if (params.teamIds.length === 0) {
            return Result.ok([]);
        }
        // A membership lookup, read as the system (D48); read checks run as the request identity.
        const listed = await this.identityContext.withoutAuthorization(() => {
            return this.listUsers.execute({ where: { teams_in: [...params.teamIds] } });
        });
        if (listed.isFail()) {
            return Result.fail(new RoutingDependencyError(listed.error));
        }
        const settings = await this.getSettings.execute({ includeExpired: true });
        if (settings.isFail()) {
            return Result.fail(new RoutingDependencyError(settings.error));
        }
        const exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;

        const users = listed.value
            .filter(user => {
                return (
                    user.id !== params.requesterId &&
                    params.teamIds.some(teamId => user.teams?.includes(teamId))
                );
            })
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const members: RoutingMember[] = [];
        for (const user of users) {
            const canRead = !readAccess
                ? false
                : params.read.type === "target"
                  ? await readAccess.canUserRead({
                        userId: user.id,
                        model: params.model,
                        targetId: params.read.targetId,
                        targetRevisionId: params.read.targetRevisionId
                    })
                  : await readAccess.canUserReadInFolder({
                        userId: user.id,
                        model: params.model,
                        folderId: params.read.folderId
                    });
            const exclusion = exclusions.find(item => item.userId === user.id);
            members.push({
                id: user.id,
                displayName: user.displayName,
                teamIds: [...(user.teams ?? [])],
                exclusion: exclusion ? { ...exclusion } : null,
                canRead
            });
        }
        return Result.ok(members);
    }

    public async checkUser(params: Abstraction.UserCheckParams): Abstraction.UserCheckReturn {
        if (params.userId === params.requesterId) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.requester });
        }
        if (params.teamIds.length === 0) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.notMember });
        }
        // A membership lookup, read as the system (D48); the read check runs as the request
        // identity.
        const listed = await this.identityContext.withoutAuthorization(() => {
            return this.listUsers.execute({
                where: { id_in: [params.userId], teams_in: [...params.teamIds] }
            });
        });
        if (listed.isFail()) {
            return Result.fail(new RoutingDependencyError(listed.error));
        }
        const member = listed.value.find(user => {
            return (
                user.id === params.userId &&
                params.teamIds.some(teamId => user.teams?.includes(teamId))
            );
        });
        if (!member) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.notMember });
        }
        const user = { id: member.id, displayName: member.displayName };

        const settings = await this.getSettings.execute({ includeExpired: true });
        if (settings.isFail()) {
            return Result.fail(new RoutingDependencyError(settings.error));
        }
        const exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        if (exclusions.some(exclusion => exclusion.userId === params.userId)) {
            return Result.ok({ user, skipReason: ROUTING_SKIP_REASONS.excluded });
        }

        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;
        const canRead = !readAccess
            ? false
            : params.read.type === "target"
              ? await readAccess.canUserRead({
                    userId: params.userId,
                    model: params.model,
                    targetId: params.read.targetId,
                    targetRevisionId: params.read.targetRevisionId
                })
              : await readAccess.canUserReadInFolder({
                    userId: params.userId,
                    model: params.model,
                    folderId: params.read.folderId
                });
        if (!canRead) {
            return Result.ok({ user, skipReason: ROUTING_SKIP_REASONS.cannotRead });
        }
        return Result.ok({ user, skipReason: null });
    }
}

export const RoutingEvaluatorService = Abstraction.createImplementation({
    implementation: RoutingEvaluatorServiceImpl,
    dependencies: [
        IdentityContext,
        ListUsersUseCase,
        ListUserTeamsUseCase,
        GetWorkflowSettingsUseCase,
        [ReviewTargetReadAccess, { multiple: true }],
        [ReviewTargetFolderChain, { multiple: true }],
        RoutingStrategyService
    ]
});
