import { richTextValue } from "./richTextValue";

export const articleEntry = {
    title: "Article #1",
    body: richTextValue,
    categories: [{ modelId: "category", entryId: "12345678" }],
    content: [
        {
            title: "Hero #1",
            _templateId: "cv2zf965v324ivdc7e1vt"
        },
        {
            _templateId: "9ht43gurhegkbdfsaafyads",
            nestedObject: {
                objectTitle: "Object title",
                objectNestedObject: [
                    {
                        nestedObjectNestedTitle: "nestedObjectNestedTitle-0"
                    },
                    {
                        nestedObjectNestedTitle: "nestedObjectNestedTitle-1"
                    }
                ]
            }
        }
    ]
};
