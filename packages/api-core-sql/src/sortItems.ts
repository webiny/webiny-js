export const sortItems = <T>(items: T[], sort?: string[]): T[] => {
    if (!sort?.length || items.length <= 1) {
        return items;
    }

    const parsed = sort.filter(Boolean).map(s => {
        const parts = s.split("_");
        const direction = parts.pop()?.toUpperCase() === "ASC" ? 1 : -1;
        const field = parts.join("_");
        return { field, direction };
    });

    if (parsed.length === 0) {
        return items;
    }

    return [...items].sort((a, b) => {
        for (const { field, direction } of parsed) {
            const va = (a as Record<string, unknown>)[field];
            const vb = (b as Record<string, unknown>)[field];

            if (va == null && vb == null) {
                continue;
            }
            if (va == null) {
                return direction;
            }
            if (vb == null) {
                return -direction;
            }
            if (va < vb) {
                return -1 * direction;
            }
            if (va > vb) {
                return 1 * direction;
            }
        }
        return 0;
    });
};
