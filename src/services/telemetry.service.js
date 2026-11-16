import telemetryRepository from "../repository/telemetry.repository.js";
import assetRepository from "../repository/asset.repository.js";
import workOrderService from "./workOrder.service.js";
import { AppError } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";

const telemetryService = {
    ingestTelemetry: async (payload, currentUser) => {
        const asset = await assetRepository.findByIdFull(payload.assetId);
        if (!asset) throw new AppError("Thiết bị không tồn tại", 404);

        // 1. Lưu log cảm biến
        const log = await telemetryRepository.createLog({
            assetId: payload.assetId,
            metricType: payload.metricType,
            unit: payload.unit,
            value: payload.value,
            source: payload.source || "IOT_SENSOR",
            recordedBy: currentUser?.id || null,
        });

        // 2. Cập nhật đồng hồ chạy máy (currentMeter) nếu metric là RUN_HOURS
        if (
            payload.metricType === "RUN_HOURS" &&
            payload.value > Number(asset.currentMeter || 0)
        ) {
            await assetRepository.updateAsset(
                asset.id,
                { currentMeter: payload.value },
                null,
            );
        }

        // 3. Kiểm tra ngưỡng cảnh báo
        const threshold = await telemetryRepository.findThreshold(
            payload.assetId,
            payload.metricType,
        );
        let triggeredAlert = null;
        let autoWorkOrder = null;

        if (threshold && payload.value >= threshold.warningLimit) {
            const level =
                payload.value >= threshold.dangerLimit ? "DANGER" : "WARNING";
            const existingAlert = await telemetryRepository.findActiveAlert(
                asset.id,
                threshold.id,
            );

            // Chống trùng alert nếu đã có alert OPEN/ACKNOWLEDGED cho ngưỡng này[cite: 13]
            if (!existingAlert) {
                // Nếu vượt ngưỡng đỏ (DANGER) -> Tự động sinh EMERGENCY Work Order + Auto-Assign thợ[cite: 13]
                if (level === "DANGER") {
                    autoWorkOrder = await workOrderService.createWorkOrder(
                        {
                            assetId: asset.id,
                            title: `[CẢNH BÁO ĐỎ] ${payload.metricType} vượt ngưỡng (${payload.value} ${payload.unit})`,
                            description: `Hệ thống IoT phát hiện chỉ số ${payload.metricType} đạt ${payload.value} ${payload.unit} (Ngưỡng nguy hiểm: ${threshold.dangerLimit}).`,
                            woType: "EMERGENCY",
                            priority: "CRITICAL",
                            autoAssign: true,
                        },
                        currentUser || { id: 1 },
                    );
                }

                triggeredAlert = await telemetryRepository.createAlert({
                    assetId: asset.id,
                    thresholdId: threshold.id,
                    level,
                    status: "OPEN",
                    triggerValue: payload.value,
                    workOrderId: autoWorkOrder ? autoWorkOrder.id : null,
                });
            }
        }

        return {
            log: { ...log, id: Number(log.id) },
            alert: triggeredAlert
                ? { ...triggeredAlert, id: Number(triggeredAlert.id) }
                : null,
            autoWorkOrder,
        };
    },

    getAssetTelemetry: async (assetId, query) => {
        const logs = await telemetryRepository.findLogsByAsset(
            assetId,
            query.metricType,
        );
        const limit = Math.min(200, Number(query.limit) || 50);
        return logs
            .sort((a, b) => new Date(b.recordedAt) - new Date(a.recordedAt))
            .slice(0, limit)
            .map((l) => ({ ...l, id: Number(l.id) }));
    },

    setAssetThreshold: async (assetId, payload) => {
        return await telemetryRepository.upsertThreshold({
            assetId,
            ...payload,
        });
    },

    getAlerts: async (query) => {
        const { page, limit, offset } = parsePagination(query);
        const list = await telemetryRepository.findAllAlerts({
            status: query.status,
            level: query.level,
            assetId: query.assetId,
        });
        return formatPaginated(
            list.slice(offset, offset + limit),
            list.length,
            page,
            limit,
        );
    },

    updateAlertStatus: async (alertId, status, userId) => {
        const updateData = { status };
        if (status === "ACKNOWLEDGED") {
            updateData.acknowledgedBy = userId;
            updateData.acknowledgedAt = new Date();
        }
        if (status === "RESOLVED") {
            updateData.resolvedAt = new Date();
        }
        await telemetryRepository.updateAlert(alertId, updateData);
        return { id: Number(alertId), status };
    },
};

export default telemetryService;
