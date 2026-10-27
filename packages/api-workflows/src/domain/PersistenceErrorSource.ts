/**
 * What a persistence error constructor accepts: any error, optionally carrying a driver `code`.
 */
export interface PersistenceErrorSource extends Error {
    code?: string;
}
