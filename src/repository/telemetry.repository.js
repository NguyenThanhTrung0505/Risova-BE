import { db } from "../prisma/db.ts";

const telemetryRepository = {
    createLog: async (data) => {
        return await db.orm.public.TelemetryLogs.create(data);
    },

    findThreshold: async (assetId, metricType) => {
        return await db.orm.public.AssetThresholds.where({
            assetId: Number(assetId),
            metricType,
        }).first();
    },

    upsertThreshold: async ({
        assetId,
        metricType,
        unit,
        warningLimit,
        dangerLimit,
    }) => {
        const existing = await db.orm.public.AssetThresholds.where({
            assetId: Number(assetId),
            metricType,
        }).first();

        if (existing) {
            await db.orm.public.AssetThresholds.where({
                id: existing.id,
            }).update({
                unit,
                warningLimit,
                dangerLimit,
            });
            return await db.orm.public.AssetThresholds.where({
                id: existing.id,
            }).first();
        }

        return await db.orm.public.AssetThresholds.create({
            assetId: Number(assetId),
            metricType,
            unit,
            warningLimit,
            dangerLimit,
        });
    },

    findLogsByAsset: async (assetId, metricType) => {
        const filter = { assetId: Number(assetId) };
        if (metricType) filter.metricType = metricType;
        return await db.orm.public.TelemetryLogs.where(filter).all();
    },

    // Kiểm tra xem đã có alert nào chưa RESOLVED cho cặp (assetId, thresholdId) chưa
    findActiveAlert: async (assetId, thresholdId) => {
        const list = await db.orm.public.Alerts.where({
            assetId: Number(assetId),
            thresholdId: Number(thresholdId),
        }).all();
        return list.find((a) => a.status !== "RESOLVED") || null;
    },

    createAlert: async (data) => {
        return await db.orm.public.Alerts.create(data);
    },

    updateAlert: async (id, data) => {
        return await db.orm.public.Alerts.where({ id: BigInt(id) }).update(
            data,
        );
    },

    findAllAlerts: async ({ status, level, assetId }) => {
        const filter = {};
        if (status) filter.status = status;
        if (level) filter.level = level;
        if (assetId) filter.assetId = Number(assetId);

        const [alerts, assets, thresholds] = await Promise.all([
            db.orm.public.Alerts.where(filter).all(),
            db.orm.public.Assets.all(),
            db.orm.public.AssetThresholds.all(),
        ]);

        const assetMap = new Map(assets.map((a) => [a.id, a]));
        const thMap = new Map(thresholds.map((t) => [t.id, t]));

        return alerts
            .sort((a, b) => Number(b.id) - Number(a.id))
            .map((al) => ({
                ...al,
                id: Number(al.id), // Serialize BigInt an toàn cho JSON
                assetCode: assetMap.get(al.assetId)?.assetCode,
                assetName: assetMap.get(al.assetId)?.name,
                metricType: thMap.get(al.thresholdId)?.metricType,
                unit: thMap.get(al.thresholdId)?.unit,
                warningLimit: thMap.get(al.thresholdId)?.warningLimit,
                dangerLimit: thMap.get(al.thresholdId)?.dangerLimit,
            }));
    },
};

export default telemetryRepository;
