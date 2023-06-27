export interface Folder {
    id: string;
    parent?: string | null | "root";
    title: string;
}

export const createOldFoldersData = (): Folder[] => {
    return [
        {
            id: "test-1",
            parent: "ROOT",
            title: "Test 1"
        },
        {
            id: "test-2",
            parent: null,
            title: "Test 2"
        },
        {
            id: "test-3",
            parent: undefined,
            title: "Test 3"
        },
        {
            id: "test-4",
            parent: "root",
            title: "Test 4"
        },
        {
            id: "test-1-1",
            parent: "test-1",
            title: "Test 1-1"
        },
        {
            id: "test-1-2",
            parent: "test-1",
            title: "Test 1-2"
        },
        {
            id: "test-2-1",
            parent: "test-2",
            title: "Test 2-1"
        },
        {
            id: "test-2-2",
            parent: "test-2",
            title: "Test 2-2"
        },
        {
            id: "test-3-1",
            parent: "test-3",
            title: "Test 3-1"
        },
        {
            id: "test-3-2",
            parent: "test-3",
            title: "Test 3-2"
        },
        {
            id: "test-3-3",
            parent: "test-3",
            title: "Test 3-3"
        },
        {
            id: "test-4-1",
            parent: "test-4",
            title: "Test 4-1"
        },
        {
            id: "test-4-2",
            parent: "test-4",
            title: "Test 4-2"
        },
        {
            id: "test-4-3",
            parent: "test-4",
            title: "Test 4-3"
        }
    ];
};
