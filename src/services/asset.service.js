import assetRepository from "../repository/asset.repository.js";
import { AppError } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";

const assetService = {
    getAssets: async (query) => {
        const { page, limit, offset } = parsePagination(query);
        let list = await assetRepository.findAll({
            status: query.status,
            locationId: query.locationId,
            requiredSpecialtyId: query.requiredSpecialtyId,
            priority: query.priority,
        });

        if (query.search) {
            const kw = query.search.toLowerCase();
            list = list.filter(
                (a) =>
                    a.assetCode.toLowerCase().includes(kw) ||
                    a.name.toLowerCase().includes(kw),
            );
        }

        list.sort((a, b) => a.id - b.id);
        const paginated = list.slice(offset, offset + limit);
        return formatPaginated(paginated, list.length, page, limit);
    },

    getAssetDetail: async (id) => {
        const asset = await assetRepository.findByIdFull(id);
        if (!asset) throw new AppError("Không tìm thấy thiết bị", 404);
        return asset;
    },

    createAsset: async (payload) => {
        const { details, installedDate, warrantyExpiry, ...assetFields } =
            payload;
        const assetData = {
            ...assetFields,
            ...(installedDate && { installedDate: new Date(installedDate) }),
            ...(warrantyExpiry && { warrantyExpiry: new Date(warrantyExpiry) }),
        };

        const detailData = details
            ? {
                  ...details,
                  ...(details.purchaseDate && {
                      purchaseDate: new Date(details.purchaseDate),
                  }),
              }
            : null;

        const created = await assetRepository.createWithDetails(
            assetData,
            detailData,
        );
        return await assetRepository.findByIdFull(created.id);
    },

    updateAsset: async (id, payload) => {
        const existing = await assetRepository.findByIdFull(id);
        if (!existing) throw new AppError("Thiết bị không tồn tại", 404);

        const { details, installedDate, warrantyExpiry, ...assetFields } =
            payload;
        const assetData = {
            ...assetFields,
            ...(installedDate && { installedDate: new Date(installedDate) }),
            ...(warrantyExpiry && { warrantyExpiry: new Date(warrantyExpiry) }),
        };

        const detailData = details
            ? {
                  ...details,
                  ...(details.purchaseDate && {
                      purchaseDate: new Date(details.purchaseDate),
                  }),
              }
            : null;

        await assetRepository.updateAsset(id, assetData, detailData);
        return await assetRepository.findByIdFull(id);
    },
};

export default assetService;
