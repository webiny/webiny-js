export const addMimeTag = (tags: string[], mime: string): string[] => [...tags, `mime:${mime}`];
