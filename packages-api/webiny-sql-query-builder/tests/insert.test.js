import {assert} from 'chai';
const queryBuilder = require('./../src');

describe('INSERT statement test', function () {
    it('should generate an INSERT statement', async () => {
        const sql = queryBuilder.build({
            operation: 'insert',
            table: 'TestTable',
            data: {name: 'Test', enabled: 1}
        });

        assert.equal(sql, `INSERT INTO TestTable (name, enabled) VALUES ('Test', 1)`);
    });

    it('should generate an INSERT statement and preserve false in query', async () => {
        const sql = queryBuilder.build({
            operation: 'insert',
            table: 'TestTable',
            data: {name: 'Test', enabled: false}
        });

        assert.equal(sql, `INSERT INTO TestTable (name, enabled) VALUES ('Test', false)`);
    });
});