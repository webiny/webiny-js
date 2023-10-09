import { IQueryObjectGateway } from "~/components/AdvancedSearch/QueryObject";

const mockGateway: IQueryObjectGateway = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getById: jest.fn()
};

export const createMockGateway = ({
    list,
    create,
    update,
    delete: deleteFn,
    getById
}: Partial<IQueryObjectGateway>): IQueryObjectGateway => ({
    ...mockGateway,
    ...(list && { list }),
    ...(create && { create }),
    ...(update && { update }),
    ...(deleteFn && { delete: deleteFn }),
    ...(getById && { getById })
});
