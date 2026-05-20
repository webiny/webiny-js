export const statusVariant = (status: string) => {
    switch (status) {
        case "delivered":
            return "success" as const;
        case "failed":
            return "destructive" as const;
        default:
            return "warning" as const;
    }
};
