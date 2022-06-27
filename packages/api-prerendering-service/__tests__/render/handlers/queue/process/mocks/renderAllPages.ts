import { QueueJob } from "~/types";
import mdbid from "mdbid";

const tenant = "root";
const locale = "en-US";

const mocks = {
    job: (index): QueueJob => {
        return {
            id: mdbid(),
            args: {
                render: {
                    tenant,
                    locale,
                    tag: {
                        value: `main-menu-${index}`,
                        key: "pb-menu"
                    }
                }
            }
        };
    },
    renderAllJob: ({ index, tenant = "root" }): QueueJob => {
        return {
            id: index || mdbid(),
            args: {
                render: {
                    tenant,
                    locale,
                    path: "*"
                }
            }
        };
    }
};

export default mocks;
