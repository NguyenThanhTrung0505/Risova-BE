import locationRepository from "../repository/location.repository.js";
import { AppError } from "../common/helpers/error.helper.js";

const buildLocationTree = (items, parentId = null) => {
    return items
        .filter((item) => item.parentId === parentId)
        .sort((a, b) => a.id - b.id)
        .map((item) => ({
            ...item,
            children: buildLocationTree(items, item.id),
        }));
};

const locationService = {
    getTree: async () => {
        const all = await locationRepository.findAll();
        return buildLocationTree(all, null);
    },

    getFlatList: async () => {
        const all = await locationRepository.findAll();
        return all.sort((a, b) => a.id - b.id);
    },

    createLocation: async (data) => {
        if (data.parentId) {
            const parent = await locationRepository.findById(data.parentId);
            if (!parent)
                throw new AppError("Vị trí cha (parentId) không tồn tại", 404);
        }
        return await locationRepository.create(data);
    },

    updateLocation: async (id, data) => {
        const existing = await locationRepository.findById(id);
        if (!existing) throw new AppError("Không tìm thấy vị trí", 404);
        if (data.parentId && Number(data.parentId) === Number(id)) {
            throw new AppError("Vị trí cha không thể là chính nó", 400);
        }
        await locationRepository.update(id, data);
        return await locationRepository.findById(id);
    },
};

export default locationService;
