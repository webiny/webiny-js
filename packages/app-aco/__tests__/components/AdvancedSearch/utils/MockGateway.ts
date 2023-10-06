import { GatewayInterface } from "~/components/AdvancedSearch/QueryObject";

const mockGateway: GatewayInterface = {
    list: jest.fn(),
    get: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
};

export const createMockGateway = ({
    list,
    get,
    create,
    update,
    delete: deleteFn
}: Partial<GatewayInterface>): GatewayInterface => ({
    ...mockGateway,
    ...(list && { list }),
    ...(get && { get }),
    ...(create && { create }),
    ...(update && { update }),
    ...(deleteFn && { delete: deleteFn })
});
