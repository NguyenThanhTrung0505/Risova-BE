import workOrderRepository from "../repository/workOrder.repository.js";
import assetRepository from "../repository/asset.repository.js";
import { AppError } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";

const generateWoCode = () => {
    const year = new Date().getFullYear();
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `WO-${year}-${rand}`;
};

const workOrderService = {
    getWorkOrders: async (query, currentUser) => {
        const { page, limit, offset } = parsePagination(query);

        // Nếu là TECHNICIAN và truyền myTasks=true thì lọc theo chính họ
        const assignedFilter =
            currentUser.role === "TECHNICIAN" && query.myTasks === "true"
                ? currentUser.id
                : query.assignedTo;

        let list = await workOrderRepository.findAll({
            status: query.status,
            woType: query.woType,
            priority: query.priority,
            assetId: query.assetId,
            assignedTo: assignedFilter,
        });

        if (query.search) {
            const kw = query.search.toLowerCase();
            list = list.filter(
                (w) =>
                    w.woCode.toLowerCase().includes(kw) ||
                    w.title.toLowerCase().includes(kw) ||
                    (w.assetCode && w.assetCode.toLowerCase().includes(kw)),
            );
        }

        list.sort((a, b) => b.id - a.id);
        const paginated = list.slice(offset, offset + limit);
        return formatPaginated(paginated, list.length, page, limit);
    },

    getWorkOrderDetail: async (id) => {
        const wo = await workOrderRepository.findByIdFull(id);
        if (!wo) throw new AppError("Không tìm thấy phiếu công việc", 404);
        return wo;
    },

    createWorkOrder: async (payload, currentUser) => {
        const asset = await assetRepository.findByIdFull(payload.assetId);
        if (!asset) throw new AppError("Thiết bị không tồn tại", 404);

        let assignedTo = payload.assignedTo || null;
        let status = assignedTo ? "ASSIGNED" : "OPEN";

        // Kích hoạt Auto-Assign nếu bật autoAssign = true và chưa chỉ định thợ
        if (!assignedTo && payload.autoAssign) {
            const bestTech = await workOrderRepository.findBestTechnician(
                asset.requiredSpecialtyId,
            );
            if (bestTech) {
                assignedTo = bestTech.id;
                status = "ASSIGNED";
            }
        }

        const woData = {
            woCode: generateWoCode(),
            assetId: payload.assetId,
            title: payload.title,
            description: payload.description || null,
            woType: payload.woType,
            priority: payload.priority,
            status,
            reportedBy: currentUser.id,
            assignedTo,
            scheduledStart: payload.scheduledStart
                ? new Date(payload.scheduledStart)
                : null,
            scheduledEnd: payload.scheduledEnd
                ? new Date(payload.scheduledEnd)
                : null,
            estimatedCost: payload.estimatedCost || null,
        };

        const created = await workOrderRepository.createWorkOrder({
            woData,
            checklists: payload.checklists || [],
            parts: payload.parts || [],
        });

        // Nếu là sự cố khẩn cấp (EMERGENCY) -> chuyển trạng thái máy sang BROKEN và ghi nhận downtime
        if (payload.woType === "EMERGENCY") {
            await workOrderRepository.updateAssetStatus(
                payload.assetId,
                "BROKEN",
            );
            await workOrderRepository.createDowntime({
                assetId: payload.assetId,
                workOrderId: created.id,
                startedAt: new Date(),
            });
        }

        return await workOrderRepository.findByIdFull(created.id);
    },

    updateStatus: async (id, payload, currentUser) => {
        const wo = await workOrderRepository.findByIdFull(id);
        if (!wo) throw new AppError("Không tìm thấy phiếu công việc", 404);

        const {
            status,
            holdReason,
            cancelReason,
            failureCodeId,
            rootCause,
            resolutionNotes,
            laborHours,
        } = payload;
        const now = new Date();
        const updateData = { status };

        if (status === "ASSIGNED") {
            if (!payload.assignedTo && !wo.assignedTo) {
                throw new AppError(
                    "Cần chỉ định kỹ thuật viên khi chuyển sang ASSIGNED",
                    400,
                );
            }
            if (payload.assignedTo) updateData.assignedTo = payload.assignedTo;
        }

        if (status === "IN_PROGRESS") {
            if (!wo.actualStart) updateData.actualStart = now;
            await workOrderRepository.updateAssetStatus(
                wo.assetId,
                "MAINTENANCE",
            );
        }

        if (status === "ON_HOLD") {
            if (!holdReason || !holdReason.trim()) {
                throw new AppError(
                    "Bắt buộc nhập lý do tạm dừng (holdReason)",
                    400,
                );
            }
            updateData.holdReason = holdReason;
        }

        if (status === "CANCELLED") {
            if (!cancelReason || !cancelReason.trim()) {
                throw new AppError(
                    "Bắt buộc nhập lý do hủy phiếu (cancelReason)",
                    400,
                );
            }
            updateData.cancelReason = cancelReason;
            await workOrderRepository.closeOpenDowntime(wo.id, now);
            await workOrderRepository.updateAssetStatus(wo.assetId, "ACTIVE");
        }

        if (status === "COMPLETED") {
            // Kiểm tra đã hoàn thành hết checklist chưa
            const uncompleted = wo.checklists.filter((c) => !c.isCompleted);
            if (uncompleted.length > 0) {
                throw new AppError(
                    `Còn ${uncompleted.length} bước checklist chưa hoàn thành`,
                    400,
                );
            }
            if (!wo.actualStart) updateData.actualStart = now;
            updateData.actualEnd = now;
            if (failureCodeId) updateData.failureCodeId = failureCodeId;
            if (rootCause) updateData.rootCause = rootCause;
            if (resolutionNotes) updateData.resolutionNotes = resolutionNotes;
            if (laborHours !== undefined) updateData.laborHours = laborHours;

            await workOrderRepository.closeOpenDowntime(wo.id, now);
            await workOrderRepository.updateAssetStatus(wo.assetId, "ACTIVE");
        }

        if (status === "CLOSED") {
            if (wo.status !== "COMPLETED") {
                throw new AppError(
                    "Chỉ có thể đóng (CLOSED) phiếu đã COMPLETED",
                    400,
                );
            }
            updateData.verifiedBy = currentUser.id;
            updateData.closedAt = now;
        }

        await workOrderRepository.updateWorkOrder(id, updateData);
        return await workOrderRepository.findByIdFull(id);
    },

    updateChecklistItem: async (woId, checklistId, payload, currentUser) => {
        const wo = await workOrderRepository.findByIdFull(woId);
        if (!wo) throw new AppError("Không tìm thấy phiếu công việc", 404);

        const item = wo.checklists.find((c) => c.id === Number(checklistId));
        if (!item) throw new AppError("Không tìm thấy bước checklist", 404);

        await workOrderRepository.toggleChecklist(checklistId, {
            isCompleted: payload.isCompleted,
            note: payload.note ?? item.note,
            evidenceImageUrl: payload.evidenceImageUrl ?? item.evidenceImageUrl,
            completedBy: payload.isCompleted ? currentUser.id : null,
            completedAt: payload.isCompleted ? new Date() : null,
        });

        return await workOrderRepository.findByIdFull(woId);
    },
};

export default workOrderService;
