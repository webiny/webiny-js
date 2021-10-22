const mocks = {
    job: index => {
        return {
            PK: "PS#Q#JOB",
            SK: `job-id-${index}`,
            TYPE: "ps.queue.job",
            args: {
                render: {
                    configuration: {
                        db: {
                            namespace: "T#root"
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
    renderAllJob: ({ index = "", namespace = "T#root" } = {}) => {
        return {
            PK: "PS#Q#JOB",
            SK: `render-all-job-id-${index}`,
            TYPE: "ps.queue.job",
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
