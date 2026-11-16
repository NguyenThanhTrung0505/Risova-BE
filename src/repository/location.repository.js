import { db } from "../prisma/db.ts";

const locationRepository = {
    findAll: async () => {
        return await db.orm.public.Locations.where({ isActive: true }).all();
    },

    findById: async (id) => {
        return await db.orm.public.Locations.where({ id: Number(id) }).first();
    },

    create: async (data) => {
        return await db.orm.public.Locations.create(data);
    },

    update: async (id, data) => {
        return await db.orm.public.Locations.where({ id: Number(id) }).update(
            data,
        );
    },
};

export default locationRepository;
