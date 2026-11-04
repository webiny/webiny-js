import React, { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { TestRoutingFailure } from "./testRouting/TestRoutingFailure.js";
import { TestRoutingInputs } from "./testRouting/TestRoutingInputs.js";
import { TestRoutingResult } from "./testRouting/TestRoutingResult.js";
import { TestRoutingStale } from "./testRouting/TestRoutingStale.js";
import { TEST_ROUTING_TAB_MESSAGES } from "./testRouting/testRoutingMessages.js";
import { useTestRoutingInputs } from "./testRouting/useTestRoutingInputs.js";
import { TEST_ROUTING_MESSAGES } from "~/editor/presentation/stepDrawer/testRoutingMessages.js";
import { useStepFormOptions } from "../useStepFormOptions.js";
import "../stepFormRendererNames.js";

export interface TestRoutingRendererProps {
    // FormView passes the element's props; the Test routing element has none.
    field: unknown;
}

/*
 * The Test routing tab (R300, R301, R315): the layout element `workflowTestRouting`. It renders the
 * drawer presenter's `TestRoutingVm` and calls its plain callbacks; the state, the run token and
 * the composed result sentences live in the presenter and the model (R234). It never runs a test by
 * itself: the admin presses `Test routing`, `Test again` or `Try again`.
 */
export const TestRoutingRenderer = (_props: TestRoutingRendererProps) => {
    const { testRouting } = useStepFormOptions();
    const inputs = useTestRoutingInputs();
    const vm = testRouting.vm;
    const running = vm.status === "running";
    // A run attempted without a requester shows the requester's validation error and does not run.
    const [attempted, setAttempted] = useState(false);
    const hasRequester = vm.requesterId !== null;
    let requesterError: string | null = null;
    if (attempted && !hasRequester) {
        requesterError = TEST_ROUTING_MESSAGES.chooseRequester;
    }

    const handleRun = () => {
        if (!hasRequester) {
            setAttempted(true);
            return;
        }
        testRouting.runTest();
    };

    let outcome: React.ReactNode = null;
    if (running) {
        outcome = (
            <div
                data-testid={"test-routing-skeleton"}
                aria-busy={"true"}
                className={"flex flex-col gap-sm"}
            >
                <Skeleton type={"text"} size={"md"} />
                <Skeleton type={"text"} size={"md"} />
                <Skeleton type={"text"} size={"md"} />
            </div>
        );
    }
    if (vm.status === "failed" && vm.errorMessage !== null) {
        outcome = (
            <TestRoutingFailure
                message={vm.errorMessage}
                canRun={vm.canRun}
                onRetry={testRouting.runTest}
            />
        );
    }
    if (vm.status === "done" && vm.result !== null) {
        let staleNotice: React.ReactNode = null;
        if (vm.stale) {
            staleNotice = <TestRoutingStale canRun={vm.canRun} onRetest={testRouting.runTest} />;
        }
        outcome = (
            <div className={"flex flex-col gap-sm"}>
                {staleNotice}
                <TestRoutingResult result={vm.result} stale={vm.stale} />
            </div>
        );
    }

    return (
        <div data-testid={"test-routing"} className={"flex flex-col gap-md"}>
            <Text as={"div"} size={"sm"}>
                {TEST_ROUTING_TAB_MESSAGES.intro}
            </Text>
            <TestRoutingInputs
                requester={{ ...inputs.requester, error: requesterError }}
                folder={inputs.folder}
            />
            <div className={"flex items-center gap-md"}>
                <Button
                    variant={"secondary"}
                    icon={<PlayArrowIcon />}
                    text={vm.buttonLabel}
                    disabled={running}
                    onClick={handleRun}
                />
            </div>
            {outcome}
        </div>
    );
};
