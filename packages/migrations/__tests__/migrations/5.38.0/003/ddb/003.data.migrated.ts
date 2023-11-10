export const createMigratedData = (content: unknown, amount = 100) => {
    return Array.from({ length: amount }).map((_, index) => {
        const id = `65415260b431680008ad4598${index.toString().padStart(4, "0")}`;

        return {
            content,
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
