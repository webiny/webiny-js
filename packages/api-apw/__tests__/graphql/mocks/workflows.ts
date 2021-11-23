export default () => ({
    workflow1: {
        app: "pageBuilder",
        title: "Main workflow",
        steps: [
            {
                title: "Legal Review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123" }]
            }
        ],
        scope: {
            type: "default"
        }
    },
    updatedWorkflow1: {
        title: "Main workflow - edited",
        steps: [
            {
                title: "Legal Review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123" }]
            },
            {
                title: "Design Review",
                type: "mandatory_blocking",
                reviewers: [{ id: "123456" }]
            }
        ],
        scope: {
            type: "default"
        }
    }
});
