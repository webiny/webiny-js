import { QueueJob } from "~/types";

const mocks = {
    job: (index: string): QueueJob => {
        return {
            id: index,
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
    }
};

export default mocks;
