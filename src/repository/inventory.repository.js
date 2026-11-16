import { db } from "../prisma/db.ts";

const inventoryRepository = {
    findAllParts: async () => {
        return await db.orm.public.SpareParts.where({ isActive: true }).all();
    },

    findPartById: async (id) => {
        return await db.orm.public.SpareParts.where({ id: Number(id) }).first();
    },

    createPart: async (data) => {
        return await db.orm.public.SpareParts.create(data);
    },

    updatePart: async (id, data) => {
        return await db.orm.public.SpareParts.where({ id: Number(id) }).update(
            data,
        );
    },

    createTransaction: async (data) => {
        return await db.orm.public.InventoryTransactions.create(data);
    },

    getTransactionsByPart: async (partId) => {
        const filter = partId ? { partId: Number(partId) } : {};
        const [txns, parts, users] = await Promise.all([
            db.orm.public.InventoryTransactions.where(filter).all(),
            db.orm.public.SpareParts.all(),
            db.orm.public.Users.all(),
        ]);

        const partMap = new Map(parts.map((p) => [p.id, p]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        return txns
            .sort((a, b) => b.id - a.id)
            .map((t) => ({
                ...t,
                partCode: partMap.get(t.partId)?.partCode,
                partName: partMap.get(t.partId)?.name,
                unit: partMap.get(t.partId)?.unit,
                performerName: userMap.get(t.performedBy)?.fullName,
            }));
    },

    findWoPartById: async (id) => {
        return await db.orm.public.WorkOrderParts.where({
            id: Number(id),
        }).first();
    },

    updateWoPart: async (id, data) => {
        return await db.orm.public.WorkOrderParts.where({
            id: Number(id),
        }).update(data);
    },
};

export default inventoryRepository;
