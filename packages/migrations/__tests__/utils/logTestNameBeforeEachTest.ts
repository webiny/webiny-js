export const logTestNameBeforeEachTest = () => {
    beforeEach(() => {
        process.stdout.write(`\n===== ${expect.getState().currentTestName} =====\n`);
    });
};
