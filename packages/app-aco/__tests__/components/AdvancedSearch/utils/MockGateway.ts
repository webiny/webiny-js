import { BaseGateway } from "~/components/AdvancedSearch/QueryObject";

const mockGateway: BaseGateway = {
    list: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
};

export const createMockGateway = ({
    list,
    create,
    update,
    delete: deleteFn
}: Partial<BaseGateway>): BaseGateway => ({
    ...mockGateway,
    ...(list && { list }),
    ...(create && { create }),
    ...(update && { update }),
    ...(deleteFn && { delete: deleteFn })
});
