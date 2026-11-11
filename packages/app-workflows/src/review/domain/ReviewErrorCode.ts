export const ReviewErrorCode = {
    NotFound: "Workflows/Review/NotFound",
    Validation: "Workflows/Review/Validation",
    InvalidState: "Workflows/Review/InvalidState",
    StepNotCurrent: "Workflows/Review/StepNotCurrent",
    AlreadyOwner: "Workflows/Review/AlreadyOwner",
    NotOwner: "Workflows/Review/NotOwner",
    StepNotTakeable: "Workflows/Review/StepNotTakeable",
    StepNotReassignable: "Workflows/Review/StepNotReassignable",
    ReassignTargetInvalid: "Workflows/Review/ReassignTargetInvalid",
    AlreadyActive: "Workflows/Review/AlreadyActive",
    ActiveReviewOnTrash: "Workflows/Review/ActiveReviewOnTrash",
    TargetSync: "Workflows/Review/TargetSync",
    NotAuthorized: "Workflows/NotAuthorized"
} as const;
