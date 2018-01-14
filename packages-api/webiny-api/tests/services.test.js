import { assert } from 'chai';
import Services from './../src/etc/services';

let services;

describe('Services test', () => {
    beforeEach(() => {
        services = new Services();
    });

    it('should return undefined if service does not exist', () => {
        assert.isUndefined(services.get('MyService'));
    });

    it('should return empty array if no services are defined', () => {
        assert.isEmpty(services.getByTag('notification'));
    });

    it('should return a value !== undefined', () => {
        services.add('Number', () => 12);
        assert.isNumber(services.get('Number'));
    });

    it('should return the same value on subsequent calls', () => {
        services.add('Number', () => 12);
        const firstRun = services.get('Number');
        const secondRun = services.get('Number');
        assert.strictEqual(firstRun, secondRun);
    });

    it('should return different value on subsequent calls', () => {
        services.add('Number', () => Math.random() * (100 - 1) + 1, false);
        const firstRun = services.get('Number');
        const secondRun = services.get('Number');
        assert.notStrictEqual(firstRun, secondRun);
    });

    it('should return services by tag', () => {
        services.add('Number', () => 12, true, ['number', 'common']);
        services.add('String', () => 'string', true, ['string', 'common']);

        const numbers = services.getByTag('number');
        assert.lengthOf(numbers, 1);
        assert.strictEqual(numbers[0], 12);

        const common = services.getByTag('common');
        assert.lengthOf(common, 2);
        assert.strictEqual(common[0], 12);
        assert.strictEqual(common[1], 'string');
    });
});