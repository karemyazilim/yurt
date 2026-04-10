import { db } from "@dokploy/server/db";
import { notifications } from "@dokploy/server/db/schema";
import DokployBackupEmail from "@dokploy/server/emails/emails/dokploy-backup";
import { renderAsync } from "@react-email/components";
import { format } from "date-fns";
import { eq } from "drizzle-orm";
import {
	sendCustomNotification,
	sendDiscordNotification,
	sendEmailNotification,
	sendGotifyNotification,
	sendLarkNotification,
	sendMattermostNotification,
	sendNetgsmNotification,
	sendNtfyNotification,
	sendPushoverNotification,
	sendResendNotification,
	sendSlackNotification,
	sendTeamsNotification,
	sendTelegramNotification,
} from "./utils";

export const sendDokployBackupNotifications = async ({
	type,
	errorMessage,
	backupSize,
}: {
	type: "error" | "success";
	errorMessage?: string;
	backupSize?: string;
}) => {
	const date = new Date();
	const unixDate = ~~(Number(date) / 1000);
	const notificationList = await db.query.notifications.findMany({
		where: eq(notifications.dokployBackup, true),
		with: {
			email: true,
			discord: true,
			telegram: true,
			slack: true,
			resend: true,
			gotify: true,
			ntfy: true,
			mattermost: true,
			custom: true,
			lark: true,
			pushover: true,
			teams: true,
			netgsm: true,
		},
	});

	for (const notification of notificationList) {
		const {
			email,
			discord,
			telegram,
			slack,
			resend,
			gotify,
			ntfy,
			mattermost,
			custom,
			lark,
			pushover,
			teams,
			netgsm,
		} = notification;

		try {
			if (email || resend) {
				const template = await renderAsync(
					DokployBackupEmail({
						type,
						errorMessage,
						date: date.toLocaleString(),
						backupSize,
					}),
				).catch();

				if (email) {
					await sendEmailNotification(
						email,
						"Yurt sunucu yedeklemesi",
						template,
					);
				}

				if (resend) {
					await sendResendNotification(
						resend,
						"Yurt sunucu yedeklemesi",
						template,
					);
				}
			}

			if (discord) {
				const decorate = (decoration: string, text: string) =>
					`${discord.decoration ? decoration : ""} ${text}`.trim();

				await sendDiscordNotification(discord, {
					title:
						type === "success"
							? decorate(">", "`✅` Yurt Yedekleme Başarılı")
							: decorate(">", "`❌` Yurt Yedekleme Başarısız"),
					color: type === "success" ? 0x57f287 : 0xed4245,
					fields: [
						{
							name: decorate("`📦`", "Backup Type"),
							value: "Yurt Sunucu Tam Yedekleme",
							inline: true,
						},
						...(backupSize
							? [
									{
										name: decorate("`💾`", "Backup Size"),
										value: backupSize,
										inline: true,
									},
								]
							: []),
						{
							name: decorate("`📅`", "Date"),
							value: `<t:${unixDate}:D>`,
							inline: true,
						},
						{
							name: decorate("`⌚`", "Time"),
							value: `<t:${unixDate}:t>`,
							inline: true,
						},
						{
							name: decorate("`❓`", "Status"),
							value: type
								.replace("error", "Failed")
								.replace("success", "Successful"),
							inline: true,
						},
						...(type === "error" && errorMessage
							? [
									{
										name: decorate("`⚠️`", "Error Message"),
										value: `\`\`\`${errorMessage}\`\`\``,
									},
								]
							: []),
					],
					timestamp: date.toISOString(),
					footer: {
						text: "Yurt Sunucu Yedekleme Bildirimi",
					},
				});
			}

			if (gotify) {
				const decorate = (decoration: string, text: string) =>
					`${gotify.decoration ? decoration : ""} ${text}\n`;

				await sendGotifyNotification(
					gotify,
					decorate(
						type === "success" ? "✅" : "❌",
						`Yurt Yedekleme ${type === "success" ? "Başarılı" : "Başarısız"}`,
					),
					`${decorate("📦", "Yedekleme Türü: Yurt Sunucu Tam Yedekleme")}` +
						`${backupSize ? decorate("💾", `Backup Size: ${backupSize}`) : ""}` +
						`${decorate("🕒", `Date: ${date.toLocaleString()}`)}` +
						`${type === "error" && errorMessage ? decorate("❌", `Error:\n${errorMessage}`) : ""}`,
				);
			}

			if (ntfy) {
				await sendNtfyNotification(
					ntfy,
					`Yurt Yedekleme ${type === "success" ? "Başarılı" : "Başarısız"}`,
					`${type === "success" ? "white_check_mark" : "x"}`,
					"",
					"📦Yedekleme Türü: Yurt Sunucu Tam Yedekleme\n" +
						`${backupSize ? `💾Backup Size: ${backupSize}\n` : ""}` +
						`🕒Date: ${date.toLocaleString()}\n` +
						`${type === "error" && errorMessage ? `❌Error:\n${errorMessage}` : ""}`,
				);
			}

			if (telegram) {
				const isError = type === "error" && errorMessage;

				const statusEmoji = type === "success" ? "✅" : "❌";
				const typeStatus = type === "success" ? "Successful" : "Failed";
				const errorMsg = isError
					? `\n\n<b>Error:</b>\n<pre>${errorMessage}</pre>`
					: "";
				const sizeInfo = backupSize
					? `\n<b>Backup Size:</b> ${backupSize}`
					: "";

				const messageText = `<b>${statusEmoji} Yurt Yedekleme ${typeStatus}</b>\n\n<b>Yedekleme Türü:</b> Yurt Sunucu Tam Yedekleme${sizeInfo}\n<b>Date:</b> ${format(date, "PP")}\n<b>Time:</b> ${format(date, "pp")}${isError ? errorMsg : ""}`;

				await sendTelegramNotification(telegram, messageText);
			}

			if (slack) {
				const { channel } = slack;
				await sendSlackNotification(slack, {
					channel: channel,
					attachments: [
						{
							color: type === "success" ? "#00FF00" : "#FF0000",
							pretext:
								type === "success"
									? ":white_check_mark: *Yurt Yedekleme Başarılı*"
									: ":x: *Yurt Yedekleme Başarısız*",
							fields: [
								...(type === "error" && errorMessage
									? [
											{
												title: "Error Message",
												value: errorMessage,
												short: false,
											},
										]
									: []),
								{
									title: "Backup Type",
									value: "Yurt Sunucu Tam Yedekleme",
									short: true,
								},
								...(backupSize
									? [
											{
												title: "Backup Size",
												value: backupSize,
												short: true,
											},
										]
									: []),
								{
									title: "Time",
									value: date.toLocaleString(),
									short: true,
								},
								{
									title: "Status",
									value: type === "success" ? "Successful" : "Failed",
									short: true,
								},
							],
						},
					],
				});
			}

			if (lark) {
				const limitCharacter = 800;
				const truncatedErrorMessage =
					errorMessage && errorMessage.length > limitCharacter
						? errorMessage.substring(0, limitCharacter)
						: errorMessage;

				await sendLarkNotification(lark, {
					msg_type: "interactive",
					card: {
						schema: "2.0",
						config: {
							update_multi: true,
							style: {
								text_size: {
									normal_v2: {
										default: "normal",
										pc: "normal",
										mobile: "heading",
									},
								},
							},
						},
						header: {
							title: {
								tag: "plain_text",
								content:
									type === "success"
										? "✅ Yurt Yedekleme Başarılı"
										: "❌ Yurt Yedekleme Başarısız",
							},
							subtitle: {
								tag: "plain_text",
								content: "",
							},
							template: type === "success" ? "green" : "red",
							padding: "12px 12px 12px 12px",
						},
						body: {
							direction: "vertical",
							padding: "12px 12px 12px 12px",
							elements: [
								{
									tag: "column_set",
									columns: [
										{
											tag: "column",
											width: "weighted",
											elements: [
												{
													tag: "markdown",
													content:
														"**Yedekleme Türü:**\nYurt Sunucu Tam Yedekleme",
													text_align: "left",
													text_size: "normal_v2",
												},
												{
													tag: "markdown",
													content: `**Status:**\n${type === "success" ? "Successful" : "Failed"}`,
													text_align: "left",
													text_size: "normal_v2",
												},
											],
											vertical_align: "top",
											weight: 1,
										},
										{
											tag: "column",
											width: "weighted",
											elements: [
												...(backupSize
													? [
															{
																tag: "markdown",
																content: `**Backup Size:**\n${backupSize}`,
																text_align: "left",
																text_size: "normal_v2",
															},
														]
													: []),
												{
													tag: "markdown",
													content: `**Date:**\n${format(date, "PP pp")}`,
													text_align: "left",
													text_size: "normal_v2",
												},
											],
											vertical_align: "top",
											weight: 1,
										},
									],
								},
								...(type === "error" && truncatedErrorMessage
									? [
											{
												tag: "markdown",
												content: `**Error Message:**\n\`\`\`\n${truncatedErrorMessage}\n\`\`\``,
												text_align: "left",
												text_size: "normal_v2",
											},
										]
									: []),
							],
						},
					},
				});
			}

			if (mattermost) {
				const statusEmoji = type === "success" ? ":white_check_mark:" : ":x:";
				const typeStatus = type === "success" ? "Successful" : "Failed";
				await sendMattermostNotification(mattermost, {
					text: `${statusEmoji} **Yurt Yedekleme ${typeStatus}**

**Yedekleme Türü:** Yurt Sunucu Tam Yedekleme${backupSize ? `\n**Backup Size:** ${backupSize}` : ""}
**Date:** ${date.toLocaleString()}
**Status:** ${typeStatus}${type === "error" && errorMessage ? `\n\n**Error:**\n\`\`\`\n${errorMessage}\n\`\`\`` : ""}`,
					channel: mattermost.channel,
					username: mattermost.username || "Yurt Bot",
				});
			}

			if (custom) {
				await sendCustomNotification(custom, {
					title: `Yurt Yedekleme ${type === "success" ? "Başarılı" : "Başarısız"}`,
					message: `Yurt sunucu yedeklemesi ${type === "success" ? "başarıyla tamamlandı" : "başarısız oldu"}`,
					backupType: "Yurt Sunucu Tam Yedekleme",
					...(backupSize ? { backupSize } : {}),
					...(type === "error" && errorMessage ? { errorMessage } : {}),
					timestamp: date.toISOString(),
					date: date.toLocaleString(),
					status: type,
					type: "dokploy-backup",
				});
			}

			if (pushover) {
				await sendPushoverNotification(
					pushover,
					`Yurt Yedekleme ${type === "success" ? "Başarılı" : "Başarısız"}`,
					`Yedekleme Türü: Yurt Sunucu Tam Yedekleme${backupSize ? `\nYedek Boyutu: ${backupSize}` : ""}\nTarih: ${date.toLocaleString()}${type === "error" && errorMessage ? `\nHata: ${errorMessage}` : ""}`,
				);
			}

			if (teams) {
				await sendTeamsNotification(teams, {
					title: `${type === "success" ? "✅" : "❌"} Yurt Yedekleme ${type === "success" ? "Başarılı" : "Başarısız"}`,
					facts: [
						{ name: "Backup Type", value: "Yurt Sunucu Tam Yedekleme" },
						...(backupSize ? [{ name: "Backup Size", value: backupSize }] : []),
						{ name: "Date", value: format(date, "PP pp") },
						{
							name: "Status",
							value: type === "success" ? "Successful" : "Failed",
						},
						...(type === "error" && errorMessage
							? [{ name: "Error Message", value: errorMessage }]
							: []),
					],
				});
			}

			if (netgsm) {
				await sendNetgsmNotification(
					netgsm,
					`Yurt Yedekleme ${type === "success" ? "Başarılı" : "Başarısız"}`,
					`Yedekleme Türü: Yurt Sunucu Tam Yedekleme${backupSize ? `\nYedek Boyutu: ${backupSize}` : ""}\nTarih: ${date.toLocaleString()}${type === "error" && errorMessage ? `\nHata: ${errorMessage}` : ""}`,
				);
			}
		} catch (error) {
			console.error(error);
		}
	}
};
