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
    }
};

export default mocks;
