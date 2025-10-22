/**
 * Abstract base class for all identity types.
 * Provides common interface for identity checks across the codebase.
 */
export abstract class Identity {
    abstract readonly id: string;
    abstract readonly displayName: string;
    abstract readonly type: string;

    /**
     * Check if this identity represents an anonymous (unauthenticated) user.
     */
    abstract isAnonymous(): boolean;
}
