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
};

export default assetRepository;
