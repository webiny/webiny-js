import { QueueJob } from "~/types";
/**
 * Missing types for mdbid package.
 */
// @ts-ignore
import mdbid from "mdbid";

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
