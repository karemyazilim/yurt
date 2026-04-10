import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Ban, CheckCircle2, RefreshCcw, Rocket, Terminal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DialogAction } from "@/components/shared/dialog-action";
import { DrawerLogs } from "@/components/shared/drawer-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { type LogLine, parseLogs } from "../../docker/logs/utils";
import { DockerTerminalModal } from "../../settings/web-server/docker-terminal-modal";

interface Props {
	mongoId: string;
}

export const ShowGeneralMongo = ({ mongoId }: Props) => {
	const { data: permissions } = api.user.getPermissions.useQuery();
	const canDeploy = permissions?.deployment.create ?? false;
	const { data, refetch } = api.mongo.one.useQuery(
		{
			mongoId,
		},
		{ enabled: !!mongoId },
	);

	const { mutateAsync: reload, isPending: isReloading } =
		api.mongo.reload.useMutation();

	const { mutateAsync: start, isPending: isStarting } =
		api.mongo.start.useMutation();

	const { mutateAsync: stop, isPending: isStopping } =
		api.mongo.stop.useMutation();

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
	const [isDeploying, setIsDeploying] = useState(false);
	api.mongo.deployWithLogs.useSubscription(
		{
			mongoId: mongoId,
		},
		{
			enabled: isDeploying,
			onData(log) {
				if (!isDrawerOpen) {
					setIsDrawerOpen(true);
				}

				if (log === "Deployment completed successfully!") {
					setIsDeploying(false);
				}

				const parsedLogs = parseLogs(log);
				setFilteredLogs((prev) => [...prev, ...parsedLogs]);
			},
			onError(error) {
				console.error("Deployment logs error:", error);
				setIsDeploying(false);
			},
		},
	);
	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">Dağıtım Ayarları</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-row gap-4 flex-wrap">
						<TooltipProvider delayDuration={0}>
							{canDeploy && (
								<DialogAction
									title="MongoDB Dağıt"
									description="Bu MongoDB veritabanını dağıtmak istediğinize emin misiniz?"
									type="default"
									onClick={async () => {
										setIsDeploying(true);
										await new Promise((resolve) => setTimeout(resolve, 1000));
										refetch();
									}}
								>
									<Button
										variant="default"
										isLoading={data?.applicationStatus === "running"}
										className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex items-center">
													<Rocket className="size-4 mr-1" />
													Dağıt
												</div>
											</TooltipTrigger>
											<TooltipPrimitive.Portal>
												<TooltipContent sideOffset={5} className="z-[60]">
													<p>MongoDB veritabanını indirir ve kurar</p>
												</TooltipContent>
											</TooltipPrimitive.Portal>
										</Tooltip>
									</Button>
								</DialogAction>
							)}
							{canDeploy && (
								<DialogAction
									title="MongoDB Yeniden Yükle"
									description="Bu MongoDB veritabanını yeniden yüklemek istediğinize emin misiniz?"
									type="default"
									onClick={async () => {
										await reload({
											mongoId: mongoId,
											appName: data?.appName || "",
										})
											.then(() => {
												toast.success("MongoDB başarıyla yeniden yüklendi");
												refetch();
											})
											.catch(() => {
												toast.error("MongoDB yeniden yüklenirken hata oluştu");
											});
									}}
								>
									<Button
										variant="secondary"
										isLoading={isReloading}
										className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
									>
										<Tooltip>
											<TooltipTrigger asChild>
												<div className="flex items-center">
													<RefreshCcw className="size-4 mr-1" />
													Yeniden Yükle
												</div>
											</TooltipTrigger>
											<TooltipPrimitive.Portal>
												<TooltipContent sideOffset={5} className="z-[60]">
													<p>MongoDB hizmetini yeniden oluşturmadan yeniden başlatır</p>
												</TooltipContent>
											</TooltipPrimitive.Portal>
										</Tooltip>
									</Button>
								</DialogAction>
							)}
							{canDeploy &&
								(data?.applicationStatus === "idle" ? (
									<DialogAction
										title="MongoDB Başlat"
										description="Bu MongoDB veritabanını başlatmak istediğinize emin misiniz?"
										type="default"
										onClick={async () => {
											await start({
												mongoId: mongoId,
											})
												.then(() => {
													toast.success("MongoDB başarıyla başlatıldı");
													refetch();
												})
												.catch(() => {
													toast.error("MongoDB başlatılırken hata oluştu");
												});
										}}
									>
										<Button
											variant="secondary"
											isLoading={isStarting}
											className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
										>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center">
														<CheckCircle2 className="size-4 mr-1" />
														Başlat
													</div>
												</TooltipTrigger>
												<TooltipPrimitive.Portal>
													<TooltipContent sideOffset={5} className="z-[60]">
														<p>
															MongoDB veritabanını başlatır (önceden başarılı bir
															kurulum gerektirir)
														</p>
													</TooltipContent>
												</TooltipPrimitive.Portal>
											</Tooltip>
										</Button>
									</DialogAction>
								) : (
									<DialogAction
										title="MongoDB Durdur"
										description="Bu MongoDB veritabanını durdurmak istediğinize emin misiniz?"
										onClick={async () => {
											await stop({
												mongoId: mongoId,
											})
												.then(() => {
													toast.success("Mongo stopped successfully");
													refetch();
												})
												.catch(() => {
													toast.error("Error stopping Mongo");
												});
										}}
									>
										<Button
											variant="destructive"
											isLoading={isStopping}
											className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
										>
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="flex items-center">
														<Ban className="size-4 mr-1" />
														Stop
													</div>
												</TooltipTrigger>
												<TooltipPrimitive.Portal>
													<TooltipContent sideOffset={5} className="z-[60]">
														<p>Stop the currently running MongoDB database</p>
													</TooltipContent>
												</TooltipPrimitive.Portal>
											</Tooltip>
										</Button>
									</DialogAction>
								))}
						</TooltipProvider>
						<DockerTerminalModal
							appName={data?.appName || ""}
							serverId={data?.serverId || ""}
						>
							<Button
								variant="outline"
								className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<div className="flex items-center">
											<Terminal className="size-4 mr-1" />
											Open Terminal
										</div>
									</TooltipTrigger>
									<TooltipPrimitive.Portal>
										<TooltipContent sideOffset={5} className="z-[60]">
											<p>Open a terminal to the MongoDB container</p>
										</TooltipContent>
									</TooltipPrimitive.Portal>
								</Tooltip>
							</Button>
						</DockerTerminalModal>
					</CardContent>
				</Card>
				<DrawerLogs
					isOpen={isDrawerOpen}
					onClose={() => {
						setIsDrawerOpen(false);
						setFilteredLogs([]);
						setIsDeploying(false);
						refetch();
					}}
					filteredLogs={filteredLogs}
				/>
			</div>
		</>
	);
};
