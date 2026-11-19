import { db } from "../prisma/db.ts";

const assetRepository = {
    findAll: async ({
        name,
        assetCode,
        status,
        locationId,
        requiredSpecialtyId,
        priority,
        limit,
        offset,
    }) => {
        let query = db.orm.public.Assets;
        if (name != null) {
            query = query.where((a) => {
                return a.name.ilike(`%${name}%`);
            });
        }
        if (assetCode != null) {
            query = query.where((a) => {
                return a.assetCode.ilike(`%${assetCode}%`);
            });
        }
        if (status != null) {
            query = query.where({ status: status });
        }
        if (locationId != null) {
            query = query.where({ locationId: locationId });
        }
        if (requiredSpecialtyId != null) {
            query = query.where({ requiredSpecialtyId: requiredSpecialtyId });
        }
        if (priority != null) {
            query = query.where({ priority: priority });
        }
        return await query.limit(limit).offset(offset).all();
    },

    findById: async (id) => {
        if (id == null) return null;
        const asset = await db.orm.public.Assets.where({ id })
            .include("assetDetails")
            .first();
        return asset ?? null; //null hoặc un thì lấy null
    },

    createWithDetails: async (assetData, detailData) => {
        const createdAsset = await db.orm.public.Assets.create(assetData);
        if (detailData && Object.keys(detailData).length > 0) {
            const detail = { ...detailData };
            if (detail.model !== undefined) {
                detail._model = detail.model;
                delete detail.model;
            }
            detail.assetId = createdAsset.id;
            await db.orm.public.AssetDetails.create(detail);
        }
        return createdAsset;
    },

    updateAsset: async (id, assetData, detailData) => {
        const assetId = Number(id);
        if (Object.keys(assetData).length > 0) {
            await db.orm.public.Assets.where({ id: assetId }).update(assetData);
        }
        if (detailData && Object.keys(detailData).length > 0) {
            const detail = { ...detailData };
            if (detail.model !== undefined) {
                detail._model = detail.model;
                delete detail.model;
            }
            const existDetail = await db.orm.public.AssetDetails.where({
                assetId,
            }).first();
            if (existDetail) {
                await db.orm.public.AssetDetails.where({ assetId }).update(
                    detail,
                );
            } else {
                detail.assetId = assetId;
                await db.orm.public.AssetDetails.create(detail);
            }
        }
    },

    getThresholds: async (id) => {
        const assetId = Number(id);
        let query = db.orm.public.AssetThresholds;
        return await query.where({ assetId: assetId }).all();
    },

    replaceThresholds: async (id, thresholds, tx = db) => {
        const query = tx.orm.public.AssetThresholds;
        const alertQuery = tx.orm.public.Alerts;
        const existing = await query.where({ assetId: id }).all();

        const keep = thresholds.map((item) => item.metricType);
        // 1. Xóa ngưỡng không còn được gửi lên và chưa có cảnh báo
        for (const item of existing) {
            if (keep.includes(item.metricType)) continue; // có tồn tại thì next
            const hasAlert = await alertQuery
                .where({ thresholdId: item.id })
                .first();
            if (!hasAlert) {
                await query.where({ id: item.id }).delete();
            }
        }

        // 2. Cập nhật ngưỡng cũ hoặc thêm ngưỡng mới
        for (const item of thresholds) {
            const oldItem = existing.find(
                (old) => old.metricType === item.metricType,
            );
            if (oldItem) {
                await query.where({ id: oldItem.id }).update({
                    unit: item.unit,
                    warningLimit: item.warningLimit,
                    dangerLimit: item.dangerLimit,
                });
            } else {
                await query.create({
                    ...item,
                    assetId: id,
                });
            }
        }
    },

    getBom: async ({ assetId, limit, offset }) => {
        return await db.orm.public.AssetBom.where({ assetId })
            .select("id", "partId", "standardQuantity")
            .include("part", (p) =>
                p.select(
                    "partCode",
                    "name",
                    "unit",
                    "quantityInStock",
                    "reservedQuantity",
                ),
            )
            .limit(limit)
            .offset(offset)
            .orderBy((a) => {
                return a.partId.desc();
            })
            .all();
    },

    replaceBom: async (assetId, items, tx = sql) => {
        await tx.orm.public.AssetBom.where({ assetId }).delete();
        for (const it of items) {
            await tx.orm.public.AssetBom.create({
                assetId,
                partId: it.partId,
                standardQuantity: it.standardQuantity ?? 1,
            });
        }
    },
};

export default assetRepository;
