import { db } from "../prisma/db.ts";

const workOrderRepository = {
    findAll: async ({ status, woType, priority, assetId, assignedTo }) => {
        const filter = {};
        if (status) filter.status = status;
        if (woType) filter.woType = woType;
        if (priority) filter.priority = priority;
        if (assetId) filter.assetId = Number(assetId);
        if (assignedTo) filter.assignedTo = Number(assignedTo);

        const [orders, assets, users] = await Promise.all([
            db.orm.public.WorkOrders.where(filter).all(),
            db.orm.public.Assets.all(),
            db.orm.public.Users.all(),
        ]);

        const assetMap = new Map(assets.map((a) => [a.id, a]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        return orders.map((wo) => ({
            ...wo,
            assetCode: assetMap.get(wo.assetId)?.assetCode || null,
            assetName: assetMap.get(wo.assetId)?.name || null,
            assigneeName: wo.assignedTo
                ? userMap.get(wo.assignedTo)?.fullName || null
                : null,
            reporterName: wo.reportedBy
                ? userMap.get(wo.reportedBy)?.fullName || null
                : null,
        }));
    },

    findByIdFull: async (id) => {
        const woId = Number(id);
        const wo = await db.orm.public.WorkOrders.where({ id: woId }).first();
        if (!wo) return null;

        const [
            asset,
            failureCode,
            checklists,
            woParts,
            spareParts,
            users,
            downtimes,
        ] = await Promise.all([
            db.orm.public.Assets.where({ id: wo.assetId }).first(),
            wo.failureCodeId
                ? db.orm.public.FailureCodes.where({
                      id: wo.failureCodeId,
                  }).first()
                : null,
            db.orm.public.WorkOrderChecklists.where({
                workOrderId: woId,
            }).all(),
            db.orm.public.WorkOrderParts.where({ workOrderId: woId }).all(),
            db.orm.public.SpareParts.all(),
            db.orm.public.Users.all(),
            db.orm.public.DowntimeEvents.where({ workOrderId: woId }).all(),
        ]);

        const partMap = new Map(spareParts.map((p) => [p.id, p]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        return {
            ...wo,
            asset,
            failureCode,
            assignee: wo.assignedTo
                ? {
                      id: wo.assignedTo,
                      fullName: userMap.get(wo.assignedTo)?.fullName,
                      employeeCode: userMap.get(wo.assignedTo)?.employeeCode,
                  }
                : null,
            reporter: wo.reportedBy
                ? {
                      id: wo.reportedBy,
                      fullName: userMap.get(wo.reportedBy)?.fullName,
                  }
                : null,
            verifier: wo.verifiedBy
                ? {
                      id: wo.verifiedBy,
                      fullName: userMap.get(wo.verifiedBy)?.fullName,
                  }
                : null,
            checklists: checklists.sort((a, b) => a.stepNumber - b.stepNumber),
            parts: woParts.map((wp) => ({
                ...wp,
                partCode: partMap.get(wp.partId)?.partCode,
                partName: partMap.get(wp.partId)?.name,
                unit: partMap.get(wp.partId)?.unit,
            })),
            downtimeEvents: downtimes,
        };
    },

    // Thuật toán Auto-Assign: tìm Technician active, available, đúng chuyên môn, ưu tiên skillLevel cao nhất & ít việc đang chạy nhất
    findBestTechnician: async (requiredSpecialtyId) => {
        const [techs, userSpecs, activeWos] = await Promise.all([
            db.orm.public.Users.where({
                role: "TECHNICIAN",
                isActive: true,
                isAvailable: true,
            }).all(),
            db.orm.public.UserSpecialties.where({
                specialtyId: Number(requiredSpecialtyId),
            }).all(),
            db.orm.public.WorkOrders.all(),
        ]);

        const specMap = new Map(
            userSpecs.map((us) => [us.userId, us.skillLevel || 1]),
        );
        const candidates = techs.filter((t) => specMap.has(t.id));
        if (candidates.length === 0) return null;

        // Đếm số WO đang ASSIGNED hoặc IN_PROGRESS của từng ứng viên
        const workloadMap = new Map();
        for (const wo of activeWos) {
            if (
                wo.assignedTo &&
                ["ASSIGNED", "IN_PROGRESS"].includes(wo.status)
            ) {
                workloadMap.set(
                    wo.assignedTo,
                    (workloadMap.get(wo.assignedTo) || 0) + 1,
                );
            }
        }

        candidates.sort((a, b) => {
            const loadA = workloadMap.get(a.id) || 0;
            const loadB = workloadMap.get(b.id) || 0;
            if (loadA !== loadB) return loadA - loadB; // Ít việc hơn lên trước
            return (specMap.get(b.id) || 1) - (specMap.get(a.id) || 1); // Skill cao hơn lên trước
        });

        return candidates[0];
    },

    createWorkOrder: async ({ woData, checklists = [], parts = [] }) => {
        const created = await db.orm.public.WorkOrders.create(woData);

        if (checklists.length > 0) {
            for (let i = 0; i < checklists.length; i++) {
                await db.orm.public.WorkOrderChecklists.create({
                    workOrderId: created.id,
                    stepNumber: checklists[i].stepNumber || i + 1,
                    taskDescription: checklists[i].taskDescription,
                });
            }
        }

        if (parts.length > 0) {
            for (const item of parts) {
                await db.orm.public.WorkOrderParts.create({
                    workOrderId: created.id,
                    partId: item.partId,
                    quantityNeeded: item.quantityNeeded,
                    status: "RESERVED",
                });
            }
        }

        return created;
    },

    updateWorkOrder: async (id, data) => {
        return await db.orm.public.WorkOrders.where({ id: Number(id) }).update(
            data,
        );
    },

    updateAssetStatus: async (assetId, status) => {
        return await db.orm.public.Assets.where({ id: Number(assetId) }).update(
            { status },
        );
    },

    toggleChecklist: async (checklistId, data) => {
        return await db.orm.public.WorkOrderChecklists.where({
            id: Number(checklistId),
        }).update(data);
    },

    createDowntime: async ({ assetId, workOrderId, startedAt }) => {
        return await db.orm.public.DowntimeEvents.create({
            assetId,
            workOrderId,
            startedAt,
        });
    },

    closeOpenDowntime: async (workOrderId, endedAt) => {
        const events = await db.orm.public.DowntimeEvents.where({
            workOrderId: Number(workOrderId),
        }).all();
        for (const ev of events) {
            if (!ev.endedAt) {
                await db.orm.public.DowntimeEvents.where({ id: ev.id }).update({
                    endedAt,
                });
            }
        }
    },
};

export default workOrderRepository;
