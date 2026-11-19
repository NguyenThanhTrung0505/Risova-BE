import assetRepository from "../repository/asset.repository.js";
import { NotFoundException, AppError } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";
import { withTransaction } from "../prisma/withTransaction.js";
import { recordAudit } from "../common/helpers/audit.helper.js";

const assetService = {
    getAll: async (query) => {
        const { page, limit, offset } = parsePagination(query);
        let results = await assetRepository.findAll({
            name: query.name?.toLowerCase(),
            assetCode: query.assetCode?.toLowerCase(),
            status: query.status,
            locationId: query.locationId,
            requiredSpecialtyId: query.requiredSpecialtyId,
            priority: query.priority,
            limit,
            offset,
        });
        return formatPaginated(results, results.length, page, limit);
    },

    getAssetDetail: async (id) => {
        const asset = await assetRepository.findById(id);
        if (!asset) throw new NotFoundException("Không tìm thấy thiết bị");
        return asset;
    },

    createAsset: async (payload) => {
        const { details, installedDate, warrantyExpiry, ...assetFields } =
            payload;
        const assetData = { ...assetFields };
        if (installedDate) {
            assetData.installedDate = new Date(installedDate);
        }
        if (warrantyExpiry) {
            assetData.warrantyExpiry = new Date(warrantyExpiry);
        }
        let detailData = null;
        if (details) {
            detailData = { ...details };
            if (details.purchaseDate) {
                detailData.purchaseDate = new Date(details.purchaseDate);
            }
        }
        const created = await assetRepository.createWithDetails(
            assetData,
            detailData,
        );
        return await assetRepository.findById(created.id);
    },

    updateAsset: async (id, payload) => {
        const existing = await assetRepository.findById(id);
        if (!existing) throw new NotFoundException("Không tìm thấy thiết bị");

        const { details, installedDate, warrantyExpiry, ...assetFields } =
            payload;
        const assetData = { ...assetFields };
        if (installedDate) {
            assetData.installedDate = new Date(installedDate);
        }
        if (warrantyExpiry) {
            assetData.warrantyExpiry = new Date(warrantyExpiry);
        }
        let detailData = null;
        if (details) {
            detailData = { ...details };
            if (details.purchaseDate) {
                detailData.purchaseDate = new Date(details.purchaseDate);
            }
        }
        await assetRepository.updateAsset(id, assetData, detailData);
        return await assetRepository.findById(id);
    },

    getThresholds: async (req) => {
        const assetId = Number(req.params.id);
        const existing = await assetRepository.findById(assetId);
        if (!existing) throw new NotFoundException("Không tìm thấy thiết bị");
        return await assetRepository.getThresholds(assetId);
    },

    setThresholds: async (id, thresholds, actor) => {
        const assetId = Number(id);
        const existing = await assetRepository.findById(assetId);
        if (!existing) throw new NotFoundException("Không tìm thấy thiết bị");

        await withTransaction(async (tx) => {
            await assetRepository.replaceThresholds(assetId, thresholds, tx);
            await recordAudit(
                {
                    userId: actor.id,
                    action: "UPDATE",
                    entityType: "ASSET_THRESHOLD",
                    entityId: existing.assetCode,
                    newValue: thresholds,
                },
                tx,
            );
        });
        return await assetRepository.getThresholds(assetId);
    },

    getBom: async ({ id, query }) => {
        const { page, limit, offset } = parsePagination(query);
        const assetId = Number(id);
        const existing = await assetRepository.findById(assetId);
        if (!existing) throw new NotFoundException("Không tìm thấy thiết bị");
        const results = await assetRepository.getBom({
            assetId,
            limit,
            offset,
        });
        return formatPaginated(results, results.length, page, limit);
    },

    setBom: async ({ id, items, query, actor }) => {
        const { page, limit, offset } = parsePagination(query);
        const assetId = Number(id);
        const existing = await assetRepository.findById(assetId);
        if (!existing) throw new NotFoundException("Không tìm thấy thiết bị");

        const ids = items.map((i) => i.part_id);
        if (new Set(ids).size !== ids.length) {
            //set lưu không trùng lặp
            throw new AppError("Có vật tư bị khai báo trùng trong BOM");
        }
        await withTransaction(async (tx) => {
            await assetRepository.replaceBom(assetId, items, tx);
            await recordAudit(
                {
                    userId: 2,
                    action: "UPDATE_BOM",
                    entityType: "ASSET",
                    entityId: existing.assetCode,
                    newValue: items,
                },
                tx,
            );
        });
        const results = await assetRepository.getBom({
            assetId,
            limit,
            offset,
        });
        return formatPaginated(results, results.length, page, limit);
    },
};

export default assetService;
