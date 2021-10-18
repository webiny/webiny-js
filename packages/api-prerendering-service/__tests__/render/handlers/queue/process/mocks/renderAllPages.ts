import { QueueJob } from "~/types";

const mocks = {
    job: (index): QueueJob => {
        return {
            id: `job-${index}`,
            args: {
                render: {
                    configuration: {
                        db: {
                            namespace: "root"
                        }
                    },
                    tag: {
                        value: `main-menu-${index}`,
                        key: "pb-menu"
                    }
                }
            }
        };
    },
    renderAllJob: ({ index, namespace = "root" }): QueueJob => {
        return {
            id: `job-all-${index}`,
            args: {
                render: {
                    configuration: {
                        db: {
                            namespace
                        }
                    },
                    path: "*"
                }
            }
        };
    }
};

export default mocks;
