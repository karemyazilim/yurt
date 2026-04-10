"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

const examples = [
	"Kişisel blog oluştur",
	"Fotoğraf stüdyosu portfolyosu ekle",
	"Kişisel reklam engelleyici oluştur",
	"Sosyal medya paneli oluştur",
	"Sendgrid servisi açık kaynak alternatifi",
];

export const StepOne = ({ setTemplateInfo, templateInfo }: any) => {
	// Get servers from the API
	const { data: servers } = api.server.withSSHKey.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const hasServers = servers && servers.length > 0;
	// Show dropdown logic based on cloud environment
	// Cloud: show only if there are remote servers (no Dokploy option)
	// Self-hosted: show only if there are remote servers (Dokploy is default, hide if no remote servers)
	const shouldShowServerDropdown = hasServers;

	const handleExampleClick = (example: string) => {
		setTemplateInfo({ ...templateInfo, userInput: example });
	};
	return (
		<div className="flex flex-col h-full gap-4">
			<div className="">
				<div className="space-y-4 ">
					<h2 className="text-lg font-semibold">Adım 1: İhtiyaçlarınızı Tanımlayın</h2>
					<div className="space-y-2">
						<Label htmlFor="user-needs">Şablon ihtiyaçlarınızı tanımlayın</Label>
						<Textarea
							id="user-needs"
							placeholder="İhtiyacınız olan şablon türünü, amacını ve dahil etmek istediğiniz özellikleri açıklayın."
							value={templateInfo?.userInput}
							onChange={(e) =>
								setTemplateInfo({ ...templateInfo, userInput: e.target.value })
							}
							className="min-h-[100px]"
						/>
					</div>

					{shouldShowServerDropdown && (
						<div className="space-y-2">
							<Label htmlFor="server-deploy">
								Dağıtmak istediğiniz sunucuyu seçin (isteğe bağlı)
							</Label>
							<Select
								value={
									templateInfo.server?.serverId ||
									(!isCloud ? "dokploy" : undefined)
								}
								onValueChange={(value) => {
									if (value === "dokploy") {
										setTemplateInfo({
											...templateInfo,
											server: undefined,
										});
									} else {
										const server = servers?.find((s) => s.serverId === value);
										if (server) {
											setTemplateInfo({
												...templateInfo,
												server: server,
											});
										}
									}
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue
										placeholder={!isCloud ? "Yurt" : "Sunucu Seçin"}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{!isCloud && (
											<SelectItem value="dokploy">
												<span className="flex items-center gap-2 justify-between w-full">
													<span>Dokploy</span>
													<span className="text-muted-foreground text-xs self-center">
														Varsayılan
													</span>
												</span>
											</SelectItem>
										)}
										{servers?.map((server) => (
											<SelectItem key={server.serverId} value={server.serverId}>
												{server.name}
											</SelectItem>
										))}
										<SelectLabel>
											Sunucular ({servers?.length + (!isCloud ? 1 : 0)})
										</SelectLabel>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
					)}

					<div className="space-y-2">
						<Label>Örnekler:</Label>
						<div className="flex flex-wrap gap-2">
							{examples.map((example, index) => (
								<Button
									key={index}
									variant="outline"
									size="sm"
									onClick={() => handleExampleClick(example)}
								>
									{example}
								</Button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
