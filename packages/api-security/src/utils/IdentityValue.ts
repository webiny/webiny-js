import { SecurityIdentity } from "~/types";

type IdentityInput = SecurityIdentity | null | undefined;

export class IdentityValue {
    private readonly value: IdentityInput;

    private constructor(value: IdentityInput) {
        this.value = value;
    }

    static create(identity: IdentityInput) {
        return new IdentityValue(identity);
    }

    getValue() {
        if (!this.value) {
            return null;
        }

        return {
            id: this.value.id,
            displayName: this.value.displayName,
            type: this.value.type
        };
    }

    getValueOrFallback(fallback: IdentityInput) {
        const value = this.getValue();

        if (value) {
            return value;
        }

        return IdentityValue.create(fallback).getValue();
    }
}
