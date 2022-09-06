interface CreateFieldIdParams {
    type: string;
    id: string;
}
export const createFieldId = (params: CreateFieldIdParams): string => {
    const { type, id } = params;
    return `${type}@${id}`;
};
