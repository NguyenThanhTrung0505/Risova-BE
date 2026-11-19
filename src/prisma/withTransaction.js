import { db } from "./db.js";

export const withTransaction = async (callback) => {
    return await db.transaction(async (tx) => {
        return await callback(tx);
    });
};
