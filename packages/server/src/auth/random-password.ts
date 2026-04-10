import { randomBytes } from "node:crypto";
import bcrypt from "bcrypt";

export const generateRandomPassword = async () => {
	const passwordLength = 16;

	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	const bytes = randomBytes(passwordLength);
	let randomPassword = "";
	for (let i = 0; i < passwordLength; i++) {
		randomPassword += characters.charAt(bytes[i] % characters.length);
	}

	const saltRounds = 10;

	const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);
	return { randomPassword, hashedPassword };
};
