interface CacheValue {
    body: any;
    payload: string;
}

interface CacheDataItem {
    reads: number;
    value: CacheValue;
}

interface CacheData {
    [key: string]: CacheDataItem;
}

export class DummyCache {
    private data: CacheData = {};

    public async store(key: string, value: CacheValue): Promise<void> {
        this.data[key] = {
            reads: 0,
            value
        };
    }

    public async read(key: string): Promise<CacheDataItem | null> {
        const data = this.data[key] || null;
        if (!data) {
            return null;
        }
        this.markRead(key);
        return data;
    }

    public async getData(): Promise<CacheData> {
        return this.data;
    }

    private markRead(key: string): void {
        this.data[key].reads++;
    }
}
