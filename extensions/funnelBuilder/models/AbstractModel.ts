import { createObjectHash } from "../utils/createObjectHash";

export abstract class AbstractModel<TDto> {
    abstract toDto(): TDto;

    populate(dto: Partial<TDto>) {
        for (const dtoKey in dto) {
            if (dtoKey in this) {
                const value = dto[dtoKey];
                if (value !== undefined) {
                    // @ts-ignore We can ignore this TS error.
                    this[dtoKey] = value;
                }
            }
        }
    }

    getChecksum(): string {
        return createObjectHash(this.toDto());
    }
}
