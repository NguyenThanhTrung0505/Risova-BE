import scheduleRepository from "../repository/schedule.repository.js";
import assetRepository from "../repository/asset.repository.js";
import workOrderService from "./workOrder.service.js";
import { AppError } from "../common/helpers/error.helper.js";

const scheduleService = {
    getAllSchedules: async () => {
        const list = await scheduleRepository.findAll();
        return list.sort((a, b) => a.id - b.id);
    },

    createSchedule: async (payload) => {
        const asset = await assetRepository.findByIdFull(payload.assetId);
        if (!asset) throw new AppError("Thiết bị không tồn tại", 404);

        const now = new Date();
        let nextDueDate = payload.nextDueDate
            ? new Date(payload.nextDueDate)
            : null;
        if (!nextDueDate && payload.frequencyDays) {
            nextDueDate = new Date(
                now.getTime() + payload.frequencyDays * 24 * 60 * 60 * 1000,
            );
        }

        const currentMeter = Number(asset.currentMeter || 0);
        const nextDueMeter =
            payload.nextDueMeter ??
            (payload.meterInterval
                ? currentMeter + Number(payload.meterInterval)
                : null);

        const { parts, ...scheduleFields } = payload;
        return await scheduleRepository.create(
            {
                ...scheduleFields,
                assignedSpecialtyId:
                    payload.assignedSpecialtyId || asset.requiredSpecialtyId,
                nextDueDate,
                lastPmMeter: currentMeter,
                nextDueMeter,
            },
            parts || [],
        );
    },

    // Quét tất cả lịch bảo dưỡng đến hạn (chạy qua API trigger hoặc cronjob)
    triggerDueSchedules: async (currentUser) => {
        const schedules = await scheduleRepository.findAll();
        const now = new Date();
        const generatedWorkOrders = [];

        for (const sch of schedules) {
            const alreadyHasWo =
                await scheduleRepository.hasOpenWorkOrderForSchedule(sch.id);
            if (alreadyHasWo) continue;

            let isDue = false;

            // Kiểm tra điều kiện thời gian (TIME_BASED / HYBRID)
            if (sch.nextDueDate) {
                const leadMs =
                    (sch.generateLeadDays || 7) * 24 * 60 * 60 * 1000;
                if (
                    new Date(sch.nextDueDate).getTime() - leadMs <=
                    now.getTime()
                ) {
                    isDue = true;
                }
            }

            // Kiểm tra điều kiện giờ chạy máy (METER_BASED / HYBRID)
            if (sch.nextDueMeter !== null && sch.currentAssetMeter !== null) {
                const leadMeter = Number(sch.generateLeadMeter || 0);
                if (
                    Number(sch.currentAssetMeter) >=
                    Number(sch.nextDueMeter) - leadMeter
                ) {
                    isDue = true;
                }
            }

            if (isDue) {
                const schParts = await scheduleRepository.getScheduleParts(
                    sch.id,
                );
                const wo = await workOrderService.createWorkOrder(
                    {
                        assetId: sch.assetId,
                        title: `[PM Định kỳ] ${sch.title}`,
                        description: `Sinh tự động từ lịch bảo dưỡng #${sch.id}`,
                        woType: "PREVENTIVE",
                        priority: "MEDIUM",
                        autoAssign: true,
                        scheduledStart: sch.nextDueDate || now.toISOString(),
                        parts: schParts.map((sp) => ({
                            partId: sp.partId,
                            quantityNeeded: Number(sp.quantity),
                        })),
                    },
                    currentUser || { id: 1 },
                );

                // Cập nhật chu kỳ kế tiếp
                const nextUpdate = { lastCompletedDate: now };
                if (sch.frequencyDays) {
                    nextUpdate.nextDueDate = new Date(
                        now.getTime() + sch.frequencyDays * 24 * 60 * 60 * 1000,
                    );
                }
                if (sch.meterInterval) {
                    const baseMeter = Number(sch.currentAssetMeter || 0);
                    nextUpdate.lastPmMeter = baseMeter;
                    nextUpdate.nextDueMeter =
                        baseMeter + Number(sch.meterInterval);
                }
                await scheduleRepository.update(sch.id, nextUpdate);
                generatedWorkOrders.push(wo);
            }
        }

        return {
            scannedCount: schedules.length,
            generatedCount: generatedWorkOrders.length,
            workOrders: generatedWorkOrders,
        };
    },
};

export default scheduleService;
