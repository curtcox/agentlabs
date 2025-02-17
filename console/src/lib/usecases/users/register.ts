import { UsersService } from "$lib/services/gen-api";
import type { RegisterUserDto } from "$lib/services/gen-api";
import type { User } from "$lib/entities/user/user";
import dayjs from "dayjs";

export const registerUser = async (user: RegisterUserDto): Promise<User> => {
	const result = await UsersService.register({
		requestBody: {
			email: user.email,
			fullName: user.fullName,
			password: user.password
		}
	});

	return {
		createdAt: new Date(),
		id: result.id,
		email: result.email,
		fullName: result.fullName,
		verifiedAt: dayjs(result.verifiedAt).toDate()
	};
};
