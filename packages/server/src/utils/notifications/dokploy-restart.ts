import { db } from "@dokploy/server/db";
import { notifications } from "@dokploy/server/db/schema";
import DokployRestartEmail from "@dokploy/server/emails/emails/dokploy-restart";
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

export const sendDokployRestartNotifications = async () => {
	try {
		const date = new Date();
		const unixDate = ~~(Number(date) / 1000);
		const notificationList = await db.query.notifications.findMany({
			where: eq(notifications.dokployRestart, true),
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
				resend,
				discord,
				telegram,
				slack,
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
						DokployRestartEmail({ date: date.toLocaleString() }),
					).catch();

					if (email) {
						await sendEmailNotification(
							email,
							"Yurt Sunucusu Yeniden Başlatıldı",
							template,
						);
					}

					if (resend) {
						await sendResendNotification(
							resend,
							"Yurt Sunucusu Yeniden Başlatıldı",
							template,
						);
					}
				}

				if (discord) {
					const decorate = (decoration: string, text: string) =>
						`${discord.decoration ? decoration : ""} ${text}`.trim();

					await sendDiscordNotification(discord, {
						title: decorate(">", "`✅` Yurt Sunucusu Yeniden Başlatıldı"),
						color: 0x57f287,
						fields: [
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
								name: decorate("`❓`", "Type"),
								value: "Successful",
								inline: true,
							},
						],
						timestamp: date.toISOString(),
						footer: {
							text: "Yurt Yeniden Başlatma Bildirimi",
						},
					});
				}

				if (gotify) {
					const decorate = (decoration: string, text: string) =>
						`${gotify.decoration ? decoration : ""} ${text}\n`;
					await sendGotifyNotification(
						gotify,
						decorate("✅", "Yurt Sunucusu Yeniden Başlatıldı"),
						`${decorate("🕒", `Date: ${date.toLocaleString()}`)}`,
					);
				}

				if (ntfy) {
					await sendNtfyNotification(
						ntfy,
						"Yurt Sunucusu Yeniden Başlatıldı",
						"white_check_mark",
						"",
						`🕒Date: ${date.toLocaleString()}`,
					);
				}

				if (telegram) {
					await sendTelegramNotification(
						telegram,
						`<b>✅ Yurt Sunucusu Yeniden Başlatıldı</b>\n\n<b>Date:</b> ${format(
							date,
							"PP",
						)}\n<b>Time:</b> ${format(date, "pp")}`,
					);
				}

				if (slack) {
					const { channel } = slack;
					await sendSlackNotification(slack, {
						channel: channel,
						attachments: [
							{
								color: "#00FF00",
								pretext: ":white_check_mark: *Yurt Sunucusu Yeniden Başlatıldı*",
								fields: [
									{
										title: "Time",
										value: date.toLocaleString(),
										short: true,
									},
								],
							},
						],
					});
				}

				if (mattermost) {
					await sendMattermostNotification(mattermost, {
						text: `**✅ Yurt Sunucusu Yeniden Başlatıldı**\n\n**Date:** ${format(date, "PP")}\n**Time:** ${format(date, "pp")}`,
						channel: mattermost.channel,
						username: mattermost.username || "Yurt",
					});
				}

				if (custom) {
					try {
						await sendCustomNotification(custom, {
							title: "Yurt Sunucusu Yeniden Başlatıldı",
							message: "Yurt sunucusu başarıyla yeniden başlatıldı",
							timestamp: date.toISOString(),
							date: date.toLocaleString(),
							status: "success",
							type: "dokploy-restart",
						});
					} catch (error) {
						console.log(error);
					}
				}

				if (lark) {
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
									content: "✅ Yurt Sunucusu Yeniden Başlatıldı",
								},
								subtitle: {
									tag: "plain_text",
									content: "",
								},
								template: "green",
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
														content: "**Status:**\nSuccessful",
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
													{
														tag: "markdown",
														content: `**Restart Time:**\n${format(
															date,
															"PP pp",
														)}`,
														text_align: "left",
														text_size: "normal_v2",
													},
												],
												vertical_align: "top",
												weight: 1,
											},
										],
									},
								],
							},
						},
					});
				}

				if (pushover) {
					await sendPushoverNotification(
						pushover,
						"Yurt Sunucusu Yeniden Başlatıldı",
						`Date: ${date.toLocaleString()}`,
					);
				}

				if (teams) {
					await sendTeamsNotification(teams, {
						title: "✅ Yurt Sunucusu Yeniden Başlatıldı",
						facts: [
							{ name: "Status", value: "Successful" },
							{ name: "Restart Time", value: format(date, "PP pp") },
						],
					});
				}

				if (netgsm) {
					await sendNetgsmNotification(
						netgsm,
						"Yurt Sunucusu Yeniden Başlatıldı",
						`Date: ${date.toLocaleString()}`,
					);
				}
			} catch (error) {
				console.log(error);
			}
		}
	} catch (error) {
		console.error("[Dokploy] Restart notifications failed:", error);
	}
};
