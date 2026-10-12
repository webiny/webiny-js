import { AssignmentPageSize } from "./AssignmentPageSize.js";

const DEFAULT_ASSIGNMENT_PAGE_SIZE = 100;

class DefaultAssignmentPageSizeImpl implements AssignmentPageSize.Interface {
    readonly value = DEFAULT_ASSIGNMENT_PAGE_SIZE;
}

export const DefaultAssignmentPageSize = AssignmentPageSize.createImplementation({
    implementation: DefaultAssignmentPageSizeImpl,
    dependencies: []
});
