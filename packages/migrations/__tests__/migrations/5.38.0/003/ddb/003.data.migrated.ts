export const createMigratedData = (amount = 100) => {
    return Array.from({ length: amount }).map((_, index) => {
        const id = `65415260b431680008ad4598${index.toString().padStart(4, "0")}`;

        return {
            content: {
                compression: "gzip",
                value: "H4sIAAAAAAAAE+1XWZPaOBD+Ky5t7ZsZbK5y2KcJw856izmBHBXmQbZlW4uwvLJghqH471HLBgwGstmkUpWqwANqqS91t75uVijFMkbdT2jxcTkf/9V8vL9FTyaSy5SgLvIY96fIRAGWGHVXKCNS0iTKYP1MA5BcoYBkU8lTWC4wm4OcbVm/o/XaVNqDQAnA2Yx7lJFayoUUmErY0lKoYaUvygYOFjjxSYC6UsyJiTwuJZ9tzpWukh3MmLaiBQWNYrkjc6Wt40oZCUusByaUjZgL+soTidklo1HyJyMve1dEPkkkEeDOgghJ/YJxnylUYrVMYiGBcYZFRJODSG2cLvucrwsXvxCUjcMe9qeR4PMkODDgc8YF6iZzxtbAuMCCYo8RlbtPK0QVOyLW4J09vH7v9MEs9ggEdUQlI2hbATHBOoHmNrerCRKcy4kyMkF+TFkgSDIBrRUyIBJTpgjLnKCQixkGMVsRMx4QtZygBHYVi9rL5JLlm6HKQC2jr6Rr2E768oc+luRF6tPB3WP/xnDvh+Mb4+pOUcbQHRmXN/2RafTubof93qg/Gj8al1fuvTvsubfXRn/gjnIl6lY7EzpGtUT7og5VRjPKk8JFGZMZ6QGHFtC8Lc3nbzd/69jwnaD1k9oPqCC+zDVMEJNCc2/vPUGapkmgaqgIytafIs41wpRVOK76g6Ocs7mLVlYEWhNuUNbU3L+vWvBI4DRegrPf7G5eAfs+rteq2ovSerx905PT4cDySqU14BE33BmOSvVFC7KoLgUxwoeykzLNuvV60PAcHlrWv+0pn6cXPuPzIBQqdxcJkfVQAUpW77Qcv9F2WqHvNDxLfRzHDp1Ouw72eiDxzr7IFlDD2rdT/Oo9PamHUmQgfydH0NFEnb/f9pevr8H4YwkqI6GUH0dKOBqWaAnvUAMgAMXVJg2ALpzNZ4kGjRwtGU6CzMcpOc9devenmPbB+DiW/icE3Ae3CgpuLqdqUhDpx6jkXWmver+yYrPaLX4kqOpcAoYSxrJRnl+7Aa2GP/cU1ipVDcV2tgOqFqi1rb+2pEz0T/ODa93Qh+ZNqb7AlxP1dS6v3yutxzrgD8kBtAEFLo1vDKSKgPPgZ++TQZKWorprb/83sEeDUGYp9V630nWhqWnZwnpO/+qxv3rsmR5brrRKHWN4sXC93VM14V7AZKPDV/QELe8nwaSfC24+jIVLxMPw6roUsM20s4kYo8kUfmNBwmJWN/fC+BX/R74XWOU+wiShGjD8JnhGNtObHqeMg3mq3bLbjY7ltZp2x4F5Cget9puOOj8c5jrPWE47fuyLhndimDuh7MgwNyXLM9YrAhUgLs2o1UcB38/MdMEaHQ8AAA=="
            },
            locale: "en-US",
            entity: "PbPageBlocks",
            createdBy: {
                type: "admin",
                displayName: "Pavel Denisjuk",
                id: "6496fbd7d6062300081e4727"
            },
            name: `Logo Cloud ${index}`,
            created: "2023-10-31T19:15:44.897Z",
            TYPE: "pb.pageBlock",
            tenant: "root",
            modified: "2023-10-31T19:15:44.897Z",
            blockCategory: "logo-cloud",
            createdOn: "2023-10-31T19:15:44.896Z",
            id,
            SK: `A`,
            PK: `T#root#L#en-US#PB#BLOCK#${id}`,
            GSI1_PK: `T#root#L#en-US#PB#BLOCKS`,
            GSI1_SK: `logo-cloud#${id}`
        };
    });
};
