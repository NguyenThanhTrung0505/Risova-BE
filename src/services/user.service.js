import bcrypt from "bcrypt";
import userRepository from "../repository/user.repository.js";
import { AppError } from "../common/helpers/error.helper.js";
import {
    formatPaginated,
    parsePagination,
} from "../common/helpers/pagination.helper.js";

const sanitizeUser = (user) => {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
};

const userService = {
    getProfile: async (userId) => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError("Không tìm thấy người dùng", 404);
        const allSpecs = await userRepository.getAllUserSpecialties();
        return {
            ...sanitizeUser(user),
            specialties: allSpecs.filter((s) => s.userId === user.id),
        };
    },

    getUsers: async (query) => {
        const { page, limit, offset } = parsePagination(query);
        const [users, allSpecs] = await Promise.all([
            userRepository.findAll({
                role: query.role,
                isActive: query.isActive,
                isAvailable: query.isAvailable,
            }),
            userRepository.getAllUserSpecialties(),
        ]);

        let filtered = users.map((u) => ({
            ...sanitizeUser(u),
            specialties: allSpecs.filter((s) => s.userId === u.id),
        }));

        if (query.search) {
            const kw = query.search.toLowerCase();
            filtered = filtered.filter(
                (u) =>
                    u.fullName.toLowerCase().includes(kw) ||
                    u.employeeCode.toLowerCase().includes(kw) ||
                    u.email.toLowerCase().includes(kw),
            );
        }

        filtered.sort((a, b) => a.id - b.id);
        const paginated = filtered.slice(offset, offset + limit);
        return formatPaginated(paginated, filtered.length, page, limit);
    },

    updateStatus: async (userId, { isActive, isAvailable, role }) => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError("Người dùng không tồn tại", 404);

        const payload = {};
        if (isActive !== undefined) payload.isActive = isActive;
        if (isAvailable !== undefined) payload.isAvailable = isAvailable;
        if (role !== undefined) payload.role = role;

        await userRepository.updateUser(userId, payload);
        return sanitizeUser(await userRepository.findById(userId));
    },

    changePassword: async (userId, { oldPassword, newPassword }) => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError("Người dùng không tồn tại", 404);

        const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isMatch) throw new AppError("Mật khẩu cũ không chính xác", 400);

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await userRepository.updateUser(userId, {
            passwordHash,
            mustChangePassword: false,
        });
    },

    setTechnicianSpecialty: async (userId, { specialtyId, skillLevel }) => {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError("Người dùng không tồn tại", 404);
        if (user.role !== "TECHNICIAN") {
            throw new AppError(
                "Chỉ gán chuyên môn kỹ thuật cho role TECHNICIAN",
                400,
            );
        }
        return await userRepository.assignSpecialty({
            userId,
            specialtyId,
            skillLevel,
        });
    },

    getMasterData: async () => {
        const [specialties, workShifts, failureCodes] = await Promise.all([
            userRepository.getSpecialties(),
            userRepository.getWorkShifts(),
            userRepository.getFailureCodes(),
        ]);
        return { specialties, workShifts, failureCodes };
    },

    scheduleUserShift: async ({ userId, shiftId, workDate }) => {
        return await userRepository.assignUserShift({
            userId,
            shiftId,
            workDate,
        });
    },
};

export default userService;
