/**
 * A object that needs to be cleaned up when it's no longer needed
 */
export interface IDisposable {
    /**
     * Clean up the object when it's no longer used. After a dispose(), an object
     * is no longer guaranteed to be usable.
     */
    dispose(): void | Promise<void>;
}
//# sourceMappingURL=IDisposable.d.ts.map