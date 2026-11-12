import { db } from "../prisma/db.ts";
const authRepository = {
    findUser: async (email) => {
        const user = await db.orm.public.Users.where({ email }).first();
        return user;
    },
    register: async (data) => {
        const result = await db.orm.public.Users.create({
            employeeCode: data.employee_code,
            fullName: data.fullName,
            email: data.email,
            passwordHash: data.password_hash,
            phone: data.phone,
            role: data.role,
        });
        return result;
    },
    findPasswordForget: async (userId) => {
        return await db.orm.public.PasswordForgets.where({ userId }).first();
    },
    saveOtp: async ({ userId, tokenHash, expiresAt }) => {
        await db.orm.public.PasswordForgets.where({ userId }).deleteAll();
        return await db.orm.public.PasswordForgets.create({
            userId,
            tokenHash,
            expiresAt,
            failedAttempts: 0,
            isUsed: false,
            lastSentAt: new Date(),
        });
    },
    saveResetToken: async (userId, { resetTokenHash, resetExpiresAt }) => {
        return await db.orm.public.PasswordForgets.where({ userId }).update({
            isUsed: true,
            resetTokenHash,
            resetExpiresAt,
        });
    },

    findByResetTokenHash: async (resetTokenHash) => {
        return await db.orm.public.PasswordForgets.where({
            resetTokenHash,
        }).first();
    },

    deleteByUserId: async (userId) => {
        return await db.orm.public.PasswordForgets.where({
            userId,
        }).deleteAll();
    },
    increaseFailedAttempts: async (record) => {
        return await db.orm.public.PasswordForgets.where({
            userId: record.userId,
        }).update({ failedAttempts: record.failedAttempts + 1 });
    },

    updatePassword: async (userId, passwordHash) => {
        return await db.orm.public.Users.where({ id: userId }).update({
            passwordHash,
        });
    },
};

export default authRepository;
