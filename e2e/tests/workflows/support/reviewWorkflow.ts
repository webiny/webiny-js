import type { ApiSession } from "../../../support/apiSession.ts";
import type { TestModel } from "../../../support/contentModel.ts";
import type { ReviewCast } from "./reviewCast.ts";
import { createPeopleWorkflow } from "./workflow.ts";
import type { PeopleStepInput } from "./workflow.ts";

/** The three-step workflow of the review tests: its id and its steps, in order. */
export interface ReviewWorkflow {
    id: string;
    first: PeopleStepInput;
    second: PeopleStepInput;
    third: PeopleStepInput;
}

/**
 * Binds a workflow of three People steps to `model`: team A (team pool, the requester may pick a
 * person), team B, then team A again.
 */
export const createReviewWorkflow = async (
    session: ApiSession,
    model: TestModel,
    cast: ReviewCast,
    runId: string
): Promise<ReviewWorkflow> => {
    const first: PeopleStepInput = {
        id: `e2efirst${runId}`,
        title: "Team A check",
        teams: [cast.teamA],
        allowManualPick: true
    };
    const second: PeopleStepInput = {
        id: `e2esecond${runId}`,
        title: "Team B check",
        teams: [cast.teamB],
        allowManualPick: false
    };
    const third: PeopleStepInput = {
        id: `e2ethird${runId}`,
        title: "Team A sign-off",
        teams: [cast.teamA],
        allowManualPick: false
    };
    const id = await createPeopleWorkflow(session, model, [first, second, third], runId);
    return { id, first, second, third };
};
