import queryBuilder from './../../../src';

describe('missing operator error test', function () {
    it('should throw an error because operator is not recognized', async () => {
        try {
            queryBuilder.build({
                operation: 'select',
                table: 'TestTable',
                where: {name: 'Test', $unknownOperator: {test: 123}}
            })
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it('should throw an error because operator is not recognized', async () => {
        try {
            queryBuilder.build({
                operation: 'select',
                table: 'TestTable',
                where: {name: 'Test', enabled: {$unknownOperator: 123}}
            })
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});