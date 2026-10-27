import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { ListUserTeamsUseCase } from "@webiny/api-core/features/users/ListUserTeams/index.js";
import type { ListUsersWhere } from "@webiny/api-core/features/users/shared/types.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
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
import { WorkflowModelParserService } from "~/features/model/WorkflowModelParserService/index.js";
import { getRoutingUserSkipReason } from "~/domain/routing/getRoutingUserSkipReason.js";
import { listNotEvaluatedTrace } from "~/domain/routing/listNotEvaluatedTrace.js";
import { listRoutingCandidates } from "~/domain/routing/listRoutingCandidates.js";
import { listStrategySkips } from "~/domain/routing/listStrategySkips.js";
import { matchRoutingRuleConditions } from "~/domain/routing/matchRoutingRuleConditions.js";
import { matchRoutingRuleLocalConditions } from "~/domain/routing/matchRoutingRuleLocalConditions.js";
import { toRoutingEvaluation } from "~/domain/routing/toRoutingEvaluation.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/abstractions.js";
import { ReviewTargetReadAccess } from "~/features/review/ReviewTargetReadAccess/abstractions.js";
import { ReviewTargetFolderChain } from "~/features/review/ReviewTargetFolderChain/abstractions.js";
import { RoutingStrategyService } from "~/features/routing/RoutingStrategyService/abstractions.js";
import { RoutingEvaluatorService as Abstraction } from "./abstractions.js";

/** What `loadMembers` lists: the step's teams, or one user in them. */
interface RoutingMemberLoadParams {
    teamIds: string[];
    /** List only this user (a person check); `null` lists every member of the teams. */
    userId: string | null;
    model: string;
    now: Date;
    /**
     * Skip the exclusions read when nobody is listed: a person check answers "not a member"
     * before it reads the settings.
     */
    skipExclusionsWithoutMembers: boolean;
}

/** The members of the teams, the active exclusions and the target's read adapter. */
interface RoutingMemberLoad {
    members: AdminUser[];
    exclusions: WorkflowExclusion[];
    readAccess: ReviewTargetReadAccess.Interface | null;
}

/** The cause of a failed member load; each entry point wraps it in `RoutingDependencyError`. */
type RoutingMemberLoadError = ListUsersUseCase.Error | GetWorkflowSettingsUseCase.Error;

class RoutingEvaluatorServiceImpl implements Abstraction.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface,
        private listUserTeams: ListUserTeamsUseCase.Interface,
        private getSettings: GetWorkflowSettingsUseCase.Interface,
        private readAccesses: ReviewTargetReadAccess.Interface[],
        private folderChains: ReviewTargetFolderChain.Interface[],
        private strategies: RoutingStrategyService.Interface,
        private modelParser: WorkflowModelParserService.Interface
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
        const pickedUserId = config.assignment.allowManualPick ? params.pickedUserId : null;

        // Members of the step's teams, the active exclusions and the read adapter, read once when
        // a pick, a user target or a strategy needs them (R111). Without members no read check
        // runs, so no adapter is needed either.
        let members: RoutingDirectoryUser[] = [];
        let exclusions: WorkflowExclusion[] = [];
        let readAccess: ReviewTargetReadAccess.Interface | null = null;
        const needsMembers =
            Boolean(pickedUserId) ||
            strategy !== "none" ||
            rules.some(rule => rule.target.type === "user");
        if (needsMembers && config.teams.length > 0) {
            const loaded = await this.loadMembers({
                teamIds: config.teams,
                userId: null,
                model: params.model,
                now: params.now,
                skipExclusionsWithoutMembers: false
            });
            if (loaded.isFail()) {
                return Result.fail(
                    new RoutingDependencyError(loaded.error, {
                        candidateTeamIds: config.teams,
                        ruleId: null,
                        skips
                    })
                );
            }
            members = loaded.value.members;
            exclusions = loaded.value.exclusions;
            readAccess = loaded.value.readAccess;
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
                let readable: string[] = [];
                if (readAccess) {
                    readable = await readAccess.filterReadableUsers({
                        model: params.model,
                        read: params.read,
                        users: [member]
                    });
                }
                if (readable.includes(member.id)) {
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
            // `null` when no app knows the model: a `modelId` condition then never matches.
            const modelId = this.modelParser.parse(params.model)?.modelId ?? null;

            // The user targets of every rule that pass the checks the walk applies before the
            // read check, checked with one adapter call (Q79); the walk looks the answers up.
            const ruleTargetUsers: RoutingDirectoryUser[] = [];
            for (const rule of rules) {
                if (rule.target.type !== "user") {
                    continue;
                }
                const targetId = rule.target.id;
                const member = members.find(item => item.id === targetId);
                const reason = getRoutingUserSkipReason({
                    userId: targetId,
                    requesterId: params.requesterId,
                    memberIds,
                    exclusions
                });
                if (!reason && member && !ruleTargetUsers.includes(member)) {
                    ruleTargetUsers.push(member);
                }
            }
            let readableRuleTargets: string[] = [];
            if (readAccess && ruleTargetUsers.length > 0) {
                readableRuleTargets = await readAccess.filterReadableUsers({
                    model: params.model,
                    read: params.read,
                    users: ruleTargetUsers
                });
            }

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
                    // oxlint-disable-next-line no-await-in-loop -- runs at most once per call: the teams are kept after the first read.
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
                        // oxlint-disable-next-line no-await-in-loop -- runs at most once per call: the folder chain is kept after the first read.
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
                    if (readableRuleTargets.includes(member.id)) {
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
        // The requester and the excluded are dropped from the candidates but recorded as skipped
        // by assignment (P2C-6).
        const strategySkips = listStrategySkips({
            members,
            candidateTeamIds,
            requesterId: params.requesterId,
            exclusions,
            pickedUserId
        });
        for (const strategySkip of strategySkips) {
            skips.push({
                kind: "skip",
                userId: strategySkip.userId,
                source: strategy,
                ruleId,
                by: null,
                reason: strategySkip.reason
            });
            skipped.push({
                userId: strategySkip.userId,
                displayName: strategySkip.displayName,
                reason: strategySkip.shownReason
            });
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
        // Read access is checked in strategy order in one adapter call, which stops at the first
        // readable candidate (R111, A47). The listed members carry their teams for folder rules.
        const membersById = new Map(members.map(member => [member.id, member]));
        const orderedUsers = ordered.value.map(candidate => {
            return membersById.get(candidate.id) ?? candidate;
        });
        let readable: string[] = [];
        if (readAccess && orderedUsers.length > 0) {
            readable = await readAccess.filterReadableUsers({
                model: params.model,
                read: params.read,
                users: orderedUsers,
                limit: 1
            });
        }
        for (const candidate of ordered.value) {
            if (readable.includes(candidate.id)) {
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
        const loaded = await this.loadMembers({
            teamIds: params.teamIds,
            userId: null,
            model: params.model,
            now: params.now,
            skipExclusionsWithoutMembers: false
        });
        if (loaded.isFail()) {
            return Result.fail(new RoutingDependencyError(loaded.error));
        }
        const { exclusions, readAccess } = loaded.value;

        const users = loaded.value.members
            .filter(user => user.id !== params.requesterId)
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        // One adapter call for every member: the target and the folder are read once (R120).
        let readable: string[] = [];
        if (readAccess && users.length > 0) {
            readable = await readAccess.filterReadableUsers({
                model: params.model,
                read: params.read,
                users
            });
        }
        const members: RoutingMember[] = [];
        for (const user of users) {
            const canRead = readable.includes(user.id);
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
        const loaded = await this.loadMembers({
            teamIds: params.teamIds,
            userId: params.userId,
            model: params.model,
            now: params.now,
            skipExclusionsWithoutMembers: true
        });
        if (loaded.isFail()) {
            return Result.fail(new RoutingDependencyError(loaded.error));
        }
        const { exclusions, readAccess } = loaded.value;
        const member = loaded.value.members[0];
        if (!member) {
            return Result.ok({ user: null, skipReason: ROUTING_SKIP_REASONS.notMember });
        }
        const user = { id: member.id, displayName: member.displayName };

        if (exclusions.some(exclusion => exclusion.userId === params.userId)) {
            return Result.ok({ user, skipReason: ROUTING_SKIP_REASONS.excluded });
        }

        let readable: string[] = [];
        if (readAccess) {
            readable = await readAccess.filterReadableUsers({
                model: params.model,
                read: params.read,
                users: [member]
            });
        }
        if (!readable.includes(member.id)) {
            return Result.ok({ user, skipReason: ROUTING_SKIP_REASONS.cannotRead });
        }
        return Result.ok({ user, skipReason: null });
    }

    /**
     * The members of the teams (or the one user), the active exclusions and the target's read
     * adapter. Listing users needs `adminUsers.user`: a membership lookup, read as the system
     * (D48). Only that call; read checks run as the request identity.
     */
    private async loadMembers(
        params: RoutingMemberLoadParams
    ): Promise<Result<RoutingMemberLoad, RoutingMemberLoadError>> {
        const where: ListUsersWhere = { teams_in: [...params.teamIds] };
        if (params.userId !== null) {
            where.id_in = [params.userId];
        }
        const listed = await this.identityContext.withoutAuthorization(() => {
            return this.listUsers.execute({ where });
        });
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }
        const members = listed.value.filter(user => {
            if (params.userId !== null && user.id !== params.userId) {
                return false;
            }
            return params.teamIds.some(teamId => user.teams?.includes(teamId));
        });

        // One read check per namespace; the last registered match wins, none means no access.
        const readAccess =
            [...this.readAccesses].reverse().find(item => item.canHandle(params.model)) ?? null;

        if (members.length === 0 && params.skipExclusionsWithoutMembers) {
            return Result.ok({ members, exclusions: [], readAccess });
        }
        const settings = await this.getSettings.execute({ includeExpired: true });
        if (settings.isFail()) {
            return Result.fail(settings.error);
        }
        const exclusions = filterActiveExclusions(settings.value.exclusions, params.now);
        return Result.ok({ members, exclusions, readAccess });
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
        RoutingStrategyService,
        WorkflowModelParserService
    ]
});
