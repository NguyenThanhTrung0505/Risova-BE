import { db } from "../../prisma/db.js";

export const recordAudit = async (
    {
        userId,
        action,
        entityType,
        entityId = null,
        oldValue = null,
        newValue = null,
        ipAddress = null,
    },
    tx = db,
) => {
    return await tx.orm.public.AuditLogs.create({
        userId,
        action,
        entityType,
        entityId: entityId == null ? null : String(entityId),
        oldValue,
        newValue,
        ipAddress,
    });
};
