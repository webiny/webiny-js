export function getLastCall(callable: jest.Mock) {
    return callable.mock.calls[callable.mock.calls.length - 1][0];
}
