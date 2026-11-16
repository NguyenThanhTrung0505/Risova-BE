import { db } from "../prisma/db.ts";

const assetRepository = {
    findAll: async ({ status, locationId, requiredSpecialtyId, priority }) => {
        const filter = {};
        if (status) filter.status = status;
        if (locationId) filter.locationId = Number(locationId);
        if (requiredSpecialtyId)
            filter.requiredSpecialtyId = Number(requiredSpecialtyId);
        if (priority) filter.priority = priority;

        const [assets, locations, specialties] = await Promise.all([
            db.orm.public.Assets.where(filter).all(),
            db.orm.public.Locations.all(),
            db.orm.public.Specialties.all(),
        ]);

        const locMap = new Map(locations.map((l) => [l.id, l]));
        const specMap = new Map(specialties.map((s) => [s.id, s]));

        return assets.map((a) => ({
            ...a,
            locationName: locMap.get(a.locationId)?.name || null,
            specialtyName: specMap.get(a.requiredSpecialtyId)?.name || null,
        }));
    },

    findByIdFull: async (id) => {
        const assetId = Number(id);
        const asset = await db.orm.public.Assets.where({ id: assetId }).first();
        if (!asset) return null;

        const [
            details,
            location,
            specialty,
            subAssets,
            thresholds,
            boms,
            parts,
            workOrders,
        ] = await Promise.all([
            db.orm.public.AssetDetails.where({ assetId }).first(),
            db.orm.public.Locations.where({ id: asset.locationId }).first(),
            db.orm.public.Specialties.where({
                id: asset.requiredSpecialtyId,
            }).first(),
            db.orm.public.Assets.where({ parentAssetId: assetId }).all(),
            db.orm.public.AssetThresholds.where({ assetId }).all(),
            db.orm.public.AssetBom.where({ assetId }).all(),
            db.orm.public.SpareParts.all(),
            db.orm.public.WorkOrders.where({ assetId }).all(),
        ]);

        const partMap = new Map(parts.map((p) => [p.id, p]));
        const formattedBom = boms.map((b) => {
            const p = partMap.get(b.partId);
            return {
                id: b.id,
                partId: b.partId,
                partCode: p?.partCode,
                partName: p?.name,
                unit: p?.unit,
                quantityInStock: p?.quantityInStock,
                standardQuantity: b.standardQuantity,
            };
        });

        // Map _model -> model theo contract.prisma
        const formattedDetails = details
            ? { ...details, model: details._model }
            : null;

        return {
            ...asset,
            location,
            requiredSpecialty: specialty,
            details: formattedDetails,
            subAssets,
            thresholds,
            bom: formattedBom,
            recentWorkOrders: workOrders
                .sort((a, b) => b.id - a.id)
                .slice(0, 10),
        };
    },

    createWithDetails: async (assetData, detailData) => {
        const createdAsset = await db.orm.public.Assets.create(assetData);
        if (detailData && Object.keys(detailData).length > 0) {
            const { model, ...restDetail } = detailData;
            await db.orm.public.AssetDetails.create({
                assetId: createdAsset.id,
                ...(model !== undefined && { _model: model }),
                ...restDetail,
            });
        }
        return createdAsset;
    },

    updateAsset: async (id, assetData, detailData) => {
        const assetId = Number(id);
        if (Object.keys(assetData).length > 0) {
            await db.orm.public.Assets.where({ id: assetId }).update(assetData);
        }
        if (detailData && Object.keys(detailData).length > 0) {
            const { model, ...restDetail } = detailData;
            const payload = {
                ...(model !== undefined && { _model: model }),
                ...restDetail,
            };
            const existDetail = await db.orm.public.AssetDetails.where({
                assetId,
            }).first();
            if (existDetail) {
                await db.orm.public.AssetDetails.where({ assetId }).update(
                    payload,
                );
            } else {
                await db.orm.public.AssetDetails.create({
                    assetId,
                    ...payload,
                });
            }
        }
    },
};

export default assetRepository;
