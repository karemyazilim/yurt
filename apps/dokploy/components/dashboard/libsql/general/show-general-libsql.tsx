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
	libsqlId: string;
}

export const ShowGeneralLibsql = ({ libsqlId }: Props) => {
	const { data, refetch } = api.libsql.one.useQuery(
		{
			libsqlId,
		},
		{ enabled: !!libsqlId },
	);

	const { mutateAsync: reload, isPending: isReloading } =
		api.libsql.reload.useMutation();

	const { mutateAsync: start, isPending: isStarting } =
		api.libsql.start.useMutation();

	const { mutateAsync: stop, isPending: isStopping } =
		api.libsql.stop.useMutation();

	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
	const [isDeploying, setIsDeploying] = useState(false);
	api.libsql.deployWithLogs.useSubscription(
		{
			libsqlId: libsqlId,
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
							<DialogAction
								title="Libsql Dağıt"
								description="Bu Libsql'i dağıtmak istediğinizden emin misiniz?"
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
												<p>Libsql veritabanını indirir ve kurar</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						</TooltipProvider>
						<TooltipProvider delayDuration={0}>
							<DialogAction
								title="Libsql Yeniden Yükle"
								description="Bu Libsql'i yeniden yüklemek istediğinizden emin misiniz?"
								type="default"
								onClick={async () => {
									await reload({
										libsqlId: libsqlId,
										appName: data?.appName || "",
									})
										.then(() => {
											toast.success("Libsql başarıyla yeniden yüklendi");
											refetch();
										})
										.catch(() => {
											toast.error("Libsql yeniden yüklenirken hata oluştu");
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
												<p>Libsql servisini yeniden oluşturmadan yeniden başlatır</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						</TooltipProvider>
						{data?.applicationStatus === "idle" ? (
							<TooltipProvider delayDuration={0}>
								<DialogAction
									title="Libsql Başlat"
									description="Bu Libsql'i başlatmak istediğinizden emin misiniz?"
									type="default"
									onClick={async () => {
										await start({
											libsqlId: libsqlId,
										})
											.then(() => {
												toast.success("Libsql başarıyla başlatıldı");
												refetch();
											})
											.catch(() => {
												toast.error("Libsql başlatılırken hata oluştu");
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
														Libsql veritabanını başlatır (önceden başarılı bir
														kurulum gerektirir)
													</p>
												</TooltipContent>
											</TooltipPrimitive.Portal>
										</Tooltip>
									</Button>
								</DialogAction>
							</TooltipProvider>
						) : (
							<TooltipProvider delayDuration={0}>
								<DialogAction
									title="Libsql Durdur"
									description="Bu Libsql'i durdurmak istediğinizden emin misiniz?"
									onClick={async () => {
										await stop({
											libsqlId: libsqlId,
										})
											.then(() => {
												toast.success("Libsql başarıyla durduruldu");
												refetch();
											})
											.catch(() => {
												toast.error("Libsql durdurulurken hata oluştu");
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
													Durdur
												</div>
											</TooltipTrigger>
											<TooltipPrimitive.Portal>
												<TooltipContent sideOffset={5} className="z-[60]">
													<p>Şu anda çalışan Libsql veritabanını durdurur</p>
												</TooltipContent>
											</TooltipPrimitive.Portal>
										</Tooltip>
									</Button>
								</DialogAction>
							</TooltipProvider>
						)}
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
											Terminal Aç
										</div>
									</TooltipTrigger>
									<TooltipPrimitive.Portal>
										<TooltipContent sideOffset={5} className="z-[60]">
											<p>Libsql konteynerine terminal aç</p>
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
