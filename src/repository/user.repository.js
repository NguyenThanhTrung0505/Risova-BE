import { db } from "../prisma/db.ts";

const userRepository = {
    findById: async (id) => {
        return await db.orm.public.Users.where({ id: Number(id) }).first();
    },

    findAll: async ({ role, isActive, isAvailable }) => {
        const filter = {};
        if (role) filter.role = role;
        if (isActive !== undefined)
            filter.isActive = isActive === "true" || isActive === true;
        if (isAvailable !== undefined)
            filter.isAvailable = isAvailable === "true" || isAvailable === true;

        return await db.orm.public.Users.where(filter).all();
    },

    getAllUserSpecialties: async () => {
        const [userSpecs, specialties] = await Promise.all([
            db.orm.public.UserSpecialties.all(),
            db.orm.public.Specialties.all(),
        ]);
        const specMap = new Map(specialties.map((s) => [s.id, s.name]));
        return userSpecs.map((us) => ({
            userId: us.userId,
            specialtyId: us.specialtyId,
            specialtyName: specMap.get(us.specialtyId) || "",
            skillLevel: us.skillLevel,
        }));
    },

    updateUser: async (id, data) => {
        return await db.orm.public.Users.where({ id: Number(id) }).update(data);
    },

    assignSpecialty: async ({ userId, specialtyId, skillLevel }) => {
        const existing = await db.orm.public.UserSpecialties.where({
            userId: Number(userId),
            specialtyId: Number(specialtyId),
        }).first();

        if (existing) {
            return await db.orm.public.UserSpecialties.where({
                userId: Number(userId),
                specialtyId: Number(specialtyId),
            }).update({ skillLevel: Number(skillLevel) });
        }

        return await db.orm.public.UserSpecialties.create({
            userId: Number(userId),
            specialtyId: Number(specialtyId),
            skillLevel: Number(skillLevel),
        });
    },

    getSpecialties: async () => {
        return await db.orm.public.Specialties.where({ isActive: true }).all();
    },

    getWorkShifts: async () => {
        return await db.orm.public.WorkShifts.all();
    },

    assignUserShift: async ({ userId, shiftId, workDate }) => {
        const dateObj = new Date(workDate);
        const existing = await db.orm.public.UserShifts.where({
            userId: Number(userId),
            workDate: dateObj,
        }).first();

        if (existing) {
            return await db.orm.public.UserShifts.where({
                id: existing.id,
            }).update({
                shiftId: Number(shiftId),
            });
        }

        return await db.orm.public.UserShifts.create({
            userId: Number(userId),
            shiftId: Number(shiftId),
            workDate: dateObj,
        });
    },

    getFailureCodes: async () => {
        return await db.orm.public.FailureCodes.where({ isActive: true }).all();
    },
};

export default userRepository;
