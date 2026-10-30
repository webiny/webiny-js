import { beforeEach } from "vitest";
import { resetLoggedMessages } from "~tests/__helpers/CapturingLogger.js";
import { resetCallLog } from "~tests/__helpers/callLog.js";
import { resetCmsEntryReads } from "~tests/__helpers/CountingCmsEntryReads.js";
import { resetReviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import { resetReviewSaveFaults } from "~tests/__helpers/FailingReviewSave.js";
import { fakeGetTask } from "~tests/__helpers/FakeGetTask.js";
import { resetFakeEditor } from "~tests/__helpers/FakeReviewTargetEditor.js";
import { resetFakeTasks } from "~tests/__helpers/FakeTaskService.js";
import { resetTenantFault } from "~tests/__helpers/FaultyTenantContext.js";
import { resetGoneAfterList } from "~tests/__helpers/GoneAfterListReviews.js";
import { recordingCleanup } from "~tests/__helpers/RecordingCleanupTaskSubtree.js";
import { resetRecordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { resetRecordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { resetStaleCheckBypassStates } from "~tests/__helpers/RecordingStaleCheck.js";
import { resetRoutingFakes } from "~tests/__helpers/routingContext.js";

/**
 * Every helper that keeps module-level state starts each test empty, so a test never sees what an
 * earlier test of its file left behind. A test file's own `beforeEach` runs after this one. A new
 * helper with module-level state adds its reset here.
 */
beforeEach(() => {
    resetLoggedMessages();
    resetCallLog();
    resetCmsEntryReads();
    resetReviewGetFaults();
    resetReviewSaveFaults();
    fakeGetTask.reset();
    resetFakeEditor();
    resetFakeTasks();
    resetTenantFault();
    resetGoneAfterList();
    recordingCleanup.reset();
    resetRecordedEvents();
    resetRecordedSyncs();
    resetStaleCheckBypassStates();
    resetRoutingFakes();
});
