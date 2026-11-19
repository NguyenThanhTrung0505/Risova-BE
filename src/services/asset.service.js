import assetRepository from "../repository/asset.repository.js";
import { NotFoundException } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";

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
        if (!existing) throw new NotFoundException("Thiết bị không tồn tại");

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
};

export default assetService;
