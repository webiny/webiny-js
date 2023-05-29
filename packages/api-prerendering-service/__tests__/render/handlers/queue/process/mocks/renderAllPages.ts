import { QueueJob } from "~/types";
import { mdbid } from "@webiny/utils";

const tenant = "root";
const locale = "en-US";

interface RenderAllJobParams {
    index: any;
    tenant?: string;
}

const mocks = {
    job: (index: any): QueueJob => {
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
    renderAllJob: ({ index, tenant = "root" }: RenderAllJobParams): QueueJob => {
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
