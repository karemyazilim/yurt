import { format } from "date-fns";
import {
	Clock,
	Key,
	KeyIcon,
	Loader2,
	MoreHorizontal,
	Network,
	ServerIcon,
	Terminal,
	Trash2,
	User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { DialogAction } from "@/components/shared/dialog-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { ShowNodesModal } from "../cluster/nodes/show-nodes-modal";
import { TerminalModal } from "../web-server/terminal-modal";
import { ShowServerActions } from "./actions/show-server-actions";
import { HandleServers } from "./handle-servers";
import { SetupServer } from "./setup-server";
import { ShowDockerContainersModal } from "./show-docker-containers-modal";
import { ShowMonitoringModal } from "./show-monitoring-modal";
import { ShowSchedulesModal } from "./show-schedules-modal";
import { ShowSwarmOverviewModal } from "./show-swarm-overview-modal";
import { ShowTraefikFileSystemModal } from "./show-traefik-file-system-modal";
import { WelcomeSubscription } from "./welcome-stripe/welcome-subscription";

export const ShowServers = () => {
	const router = useRouter();
	const query = router.query;
	const { data, refetch, isPending } = api.server.all.useQuery();
	const { mutateAsync } = api.server.remove.useMutation();
	const { data: sshKeys } = api.sshKey.all.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: canCreateMoreServers } =
		api.stripe.canCreateMoreServers.useQuery();
	const { data: permissions } = api.user.getPermissions.useQuery();

	return (
		<div className="w-full">
			{query?.success && isCloud && <WelcomeSubscription />}
			<Card className="h-full  p-2.5 rounded-xl  max-w-5xl mx-auto">
				<div className="rounded-xl bg-background shadow-md ">
					<CardHeader className="">
						<CardTitle className="text-xl flex flex-row gap-2">
							<ServerIcon className="size-6 text-muted-foreground self-center" />
							Sunucular
						</CardTitle>
						<CardDescription>
							Uygulamalarınızı uzaktan dağıtmak için sunucu ekleyin.
						</CardDescription>

						{isCloud && (
							<span
								className="bg-gradient-to-r cursor-pointer from-blue-600 via-green-500 to-indigo-400 inline-block text-transparent bg-clip-text text-sm"
								onClick={() => {
									router.push("/dashboard/settings/servers?success=true");
								}}
							>
								Başlangıcı Sıfırla
							</span>
						)}
					</CardHeader>
					<CardContent className="space-y-2 py-8 border-t">
						{isPending ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground min-h-[25vh]">
								<span>Yükleniyor...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<>
								{sshKeys?.length === 0 && data?.length === 0 ? (
									<div className="flex flex-col items-center gap-3 min-h-[25vh] justify-center">
										<KeyIcon className="size-8" />
										<span className="text-base text-muted-foreground">
											SSH Anahtarı bulunamadı. Sunucu eklemeye başlamak için bir SSH Anahtarı ekleyin.{" "}
											<Link
												href="/dashboard/settings/ssh-keys"
												className="text-primary"
											>
												SSH Anahtarı Ekle
											</Link>
										</span>
									</div>
								) : (
									<>
										{data?.length === 0 ? (
											<div className="flex flex-col items-center gap-3  min-h-[25vh] justify-center">
												<ServerIcon className="size-8 self-center text-muted-foreground" />
												<span className="text-base text-muted-foreground">
													Uygulamalarınızı uzaktan dağıtmak için sunucu eklemeye başlayın.
												</span>
												{permissions?.server.create && <HandleServers />}
											</div>
										) : (
											<div className="flex flex-col gap-4 min-h-[25vh]">
												<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
													{data?.map((server) => {
														const canDelete = server.totalSum === 0;
														const isActive = server.serverStatus === "active";
														const isBuildServer = server.serverType === "build";
														return (
															<Card
																key={server.serverId}
																className="relative hover:shadow-lg transition-shadow flex flex-col bg-transparent"
															>
																<CardHeader className="pb-3">
																	<div className="flex items-start justify-between">
																		<div className="flex items-center gap-2">
																			<ServerIcon className="size-5 text-muted-foreground" />
																			<CardTitle className="text-lg">
																				{server.name}
																			</CardTitle>
																		</div>
																		{isActive &&
																			server.sshKeyId &&
																			!isBuildServer && (
																				<DropdownMenu>
																					<DropdownMenuTrigger asChild>
																						<Button
																							variant="ghost"
																							className="h-8 w-8 p-0"
																						>
																							<span className="sr-only">
																								Daha fazla seçenek
																							</span>
																							<MoreHorizontal className="h-4 w-4" />
																						</Button>
																					</DropdownMenuTrigger>
																					<DropdownMenuContent align="end">
																						<DropdownMenuLabel>
																							Gelişmiş
																						</DropdownMenuLabel>
																						<ShowTraefikFileSystemModal
																							serverId={server.serverId}
																						/>
																						<ShowDockerContainersModal
																							serverId={server.serverId}
																						/>
																						{isCloud && (
																							<ShowMonitoringModal
																								url={`http://${server.ipAddress}:${server?.metricsConfig?.server?.port}/metrics`}
																								token={
																									server?.metricsConfig?.server
																										?.token
																								}
																							/>
																						)}
																						<ShowSwarmOverviewModal
																							serverId={server.serverId}
																						/>
																						<ShowNodesModal
																							serverId={server.serverId}
																						/>
																						<ShowSchedulesModal
																							serverId={server.serverId}
																						/>
																					</DropdownMenuContent>
																				</DropdownMenu>
																			)}
																	</div>
																	<TooltipProvider>
																		<div className="flex gap-2 mt-2 flex-wrap">
																			{isCloud && (
																				<>
																					{server.serverStatus === "active" ? (
																						<Badge variant="default">
																							{server.serverStatus}
																						</Badge>
																					) : (
																						<Tooltip delayDuration={0}>
																							<TooltipTrigger asChild>
																								<span className="inline-block">
																									<Badge
																										variant="destructive"
																										className="cursor-help"
																									>
																										{server.serverStatus}
																									</Badge>
																								</span>
																							</TooltipTrigger>
																							<TooltipContent
																								className="max-w-xs"
																								side="bottom"
																							>
																								<p className="text-sm">
																									Bu sunucu ödeme yapılmadığı için
																									devre dışı bırakıldı. Yeniden etkinleştirmek
																									için lütfen faturanızı ödeyin.
																									Bunun bir hata olduğunu düşünüyorsanız,
																									lütfen destek ile iletişime geçin.
																								</p>
																							</TooltipContent>
																						</Tooltip>
																					)}
																				</>
																			)}
																			<Badge
																				variant={
																					isBuildServer
																						? "secondary"
																						: "default"
																				}
																			>
																				{server.serverType}
																			</Badge>
																		</div>
																	</TooltipProvider>
																</CardHeader>
																<CardContent className="space-y-3 flex-1 flex flex-col">
																	<div className="flex items-center gap-2 text-sm">
																		<Network className="size-4 text-muted-foreground" />
																		<span className="text-muted-foreground">
																			IP:
																		</span>
																		<Badge variant="outline">
																			{server.ipAddress}
																		</Badge>
																		<span className="text-muted-foreground">
																			Port:
																		</span>
																		<span className="font-medium">
																			{server.port}
																		</span>
																	</div>
																	<div className="flex items-center gap-2 text-sm">
																		<User className="size-4 text-muted-foreground" />
																		<span className="text-muted-foreground">
																			Kullanıcı:
																		</span>
																		<span className="font-medium">
																			{server.username}
																		</span>
																	</div>
																	<div className="flex items-center gap-2 text-sm">
																		<Key className="size-4 text-muted-foreground" />
																		<span className="text-muted-foreground">
																			SSH Anahtarı:
																		</span>
																		<span className="font-medium">
																			{server.sshKeyId ? "Evet" : "Hayır"}
																		</span>
																	</div>
																	<div className="flex items-center gap-2 text-sm pt-2 border-t">
																		<Clock className="size-4 text-muted-foreground" />
																		<span className="text-xs text-muted-foreground">
																			Oluşturulma{" "}
																			{format(
																				new Date(server.createdAt),
																				"PPp",
																			)}
																		</span>
																	</div>

																	{/* Compact Actions */}
																	{isActive && (
																		<div className="flex items-center  gap-2 pt-3 border-t mt-auto flex-wrap">
																			<div className="flex items-center gap-2 w-full">
																				<Tooltip>
																					<TooltipTrigger asChild>
																						<SetupServer
																							serverId={server.serverId}
																						/>
																					</TooltipTrigger>
																					<TooltipContent
																						className="max-w-xs"
																						side="bottom"
																					>
																						<div className="space-y-1">
																							<p className="font-semibold">
																								Sunucu Kurulumu
																							</p>
																							<p className="text-xs text-muted-foreground">
																								Sunucunuzu Docker, Traefik ve
																								diğer temel hizmetlerle yapılandırın
																								ve başlatın
																							</p>
																						</div>
																					</TooltipContent>
																				</Tooltip>
																			</div>

																			<TooltipProvider>
																				{server.sshKeyId && (
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<div>
																								<TerminalModal
																									serverId={server.serverId}
																									asButton={true}
																								>
																									<Button
																										variant="outline"
																										size="icon"
																										className="h-9 w-9"
																									>
																										<Terminal className="h-4 w-4" />
																									</Button>
																								</TerminalModal>
																							</div>
																						</TooltipTrigger>
																						<TooltipContent>
																							<p>Terminal</p>
																						</TooltipContent>
																					</Tooltip>
																				)}

																				<Tooltip>
																					<TooltipTrigger asChild>
																						<div>
																							<HandleServers
																								serverId={server.serverId}
																								asButton={true}
																							/>
																						</div>
																					</TooltipTrigger>
																					<TooltipContent>
																						<p>Sunucuyu Düzenle</p>
																					</TooltipContent>
																				</Tooltip>

																				{server.sshKeyId && !isBuildServer && (
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<div>
																								<ShowServerActions
																									serverId={server.serverId}
																									asButton={true}
																								/>
																							</div>
																						</TooltipTrigger>
																						<TooltipContent>
																							<p>Web Sunucusu İşlemleri</p>
																						</TooltipContent>
																					</Tooltip>
																				)}

																				<div className="flex-1" />

																				{permissions?.server.delete && (
																					<Tooltip>
																						<TooltipTrigger asChild>
																							<div>
																								<DialogAction
																									disabled={!canDelete}
																									title={
																										canDelete
																											? "Sunucuyu Sil"
																											: "Sunucuda aktif hizmetler var"
																									}
																									description={
																										canDelete ? (
																											"Bu işlem sunucuyu ve ilişkili tüm verileri silecektir"
																										) : (
																											<div className="flex flex-col gap-2">
																												Bu sunucuyu silemezsiniz
																												çünkü aktif hizmetleri
																												bulunmaktadır.
																												<AlertBlock type="warning">
																													Bu sunucuyla ilişkili
																													aktif hizmetleriniz var,
																													lütfen önce onları
																													silin.
																												</AlertBlock>
																											</div>
																										)
																									}
																									onClick={async () => {
																										await mutateAsync({
																											serverId: server.serverId,
																										})
																											.then(() => {
																												refetch();
																												toast.success(
																													`${server.name} sunucusu başarıyla silindi`,
																												);
																											})
																											.catch((err) => {
																												toast.error(
																													err.message,
																												);
																											});
																									}}
																								>
																									<Button
																										variant="ghost"
																										size="icon"
																										className={`h-9 w-9 ${canDelete ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted"}`}
																									>
																										<Trash2 className="h-4 w-4" />
																									</Button>
																								</DialogAction>
																							</div>
																						</TooltipTrigger>
																						<TooltipContent>
																							<p>
																								{canDelete
																									? "Sunucuyu Sil"
																									: "Silinemez - aktif hizmetler var"}
																							</p>
																						</TooltipContent>
																					</Tooltip>
																				)}
																			</TooltipProvider>
																		</div>
																	)}
																</CardContent>
															</Card>
														);
													})}
												</div>

												{permissions?.server.create && (
													<div className="flex flex-row gap-2 flex-wrap w-full justify-end mt-4">
														{data && data?.length > 0 && (
															<div>
																<HandleServers />
															</div>
														)}
													</div>
												)}
											</div>
										)}
									</>
								)}
							</>
						)}
					</CardContent>
				</div>
			</Card>
		</div>
	);
};
