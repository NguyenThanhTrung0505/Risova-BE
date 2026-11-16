import { db } from "../prisma/db.ts";

const scheduleRepository = {
    findAll: async () => {
        const [schedules, assets, specialties] = await Promise.all([
            db.orm.public.MaintenanceSchedules.where({ isActive: true }).all(),
            db.orm.public.Assets.all(),
            db.orm.public.Specialties.all(),
        ]);

        const assetMap = new Map(assets.map((a) => [a.id, a]));
        const specMap = new Map(specialties.map((s) => [s.id, s]));

        return schedules.map((s) => ({
            ...s,
            assetCode: assetMap.get(s.assetId)?.assetCode,
            assetName: assetMap.get(s.assetId)?.name,
            currentAssetMeter: assetMap.get(s.assetId)?.currentMeter,
            specialtyName: specMap.get(s.assignedSpecialtyId)?.name,
        }));
    },

    findById: async (id) => {
        return await db.orm.public.MaintenanceSchedules.where({
            id: Number(id),
        }).first();
    },

    getScheduleParts: async (scheduleId) => {
        return await db.orm.public.ScheduleParts.where({
            scheduleId: Number(scheduleId),
        }).all();
    },

    create: async (data, parts = []) => {
        const created = await db.orm.public.MaintenanceSchedules.create(data);
        for (const p of parts) {
            await db.orm.public.ScheduleParts.create({
                scheduleId: created.id,
                partId: p.partId,
                quantity: p.quantity,
            });
        }
        return created;
    },

    update: async (id, data) => {
        return await db.orm.public.MaintenanceSchedules.where({
            id: Number(id),
        }).update(data);
    },

    hasOpenWorkOrderForSchedule: async (scheduleId) => {
        const wos = await db.orm.public.WorkOrders.where({
            scheduleId: Number(scheduleId),
        }).all();
        return wos.some(
            (w) => !["COMPLETED", "CLOSED", "CANCELLED"].includes(w.status),
        );
    },
};

export default scheduleRepository;
