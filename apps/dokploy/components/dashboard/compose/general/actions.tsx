import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Ban, CheckCircle2, RefreshCcw, Rocket, Terminal } from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { DockerTerminalModal } from "../../settings/web-server/docker-terminal-modal";

interface Props {
	composeId: string;
}
export const ComposeActions = ({ composeId }: Props) => {
	const router = useRouter();
	const { data: permissions } = api.user.getPermissions.useQuery();
	const canDeploy = permissions?.deployment.create ?? false;
	const canUpdateService = permissions?.service.create ?? false;
	const { data, refetch } = api.compose.one.useQuery(
		{
			composeId,
		},
		{ enabled: !!composeId },
	);
	const { mutateAsync: update } = api.compose.update.useMutation();
	const { mutateAsync: deploy } = api.compose.deploy.useMutation();
	const { mutateAsync: redeploy } = api.compose.redeploy.useMutation();
	const { mutateAsync: start, isPending: isStarting } =
		api.compose.start.useMutation();
	const { mutateAsync: stop, isPending: isStopping } =
		api.compose.stop.useMutation();
	return (
		<div className="flex flex-row gap-4 w-full flex-wrap ">
			<TooltipProvider delayDuration={0} disableHoverableContent={false}>
				{canDeploy && (
					<DialogAction
						title="Compose Dağıt"
						description="Bu compose'u dağıtmak istediğinizden emin misiniz?"
						type="default"
						onClick={async () => {
							await deploy({
								composeId: composeId,
							})
								.then(() => {
									toast.success("Compose başarıyla dağıtıldı");
									refetch();
									router.push(
										`/dashboard/project/${data?.environment.projectId}/environment/${data?.environmentId}/services/compose/${composeId}?tab=deployments`,
									);
								})
								.catch(() => {
									toast.error("Compose dağıtılırken hata oluştu");
								});
						}}
					>
						<Button
							variant="default"
							isLoading={data?.composeStatus === "running"}
							className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
										<p>
											Kaynak kodunu indirir ve tam bir derleme gerçekleştirir
										</p>
									</TooltipContent>
								</TooltipPrimitive.Portal>
							</Tooltip>
						</Button>
					</DialogAction>
				)}
				{canDeploy && (
					<DialogAction
						title="Compose Yeniden Yükle"
						description="Bu compose'u yeniden yüklemek istediğinizden emin misiniz?"
						type="default"
						onClick={async () => {
							await redeploy({
								composeId: composeId,
							})
								.then(() => {
									toast.success("Compose başarıyla yeniden yüklendi");
									refetch();
								})
								.catch(() => {
									toast.error("Compose yeniden yüklenirken hata oluştu");
								});
						}}
					>
						<Button
							variant="secondary"
							isLoading={data?.composeStatus === "running"}
							className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
										<p>Compose'u yeniden derlemeden yeniden yükle</p>
									</TooltipContent>
								</TooltipPrimitive.Portal>
							</Tooltip>
						</Button>
					</DialogAction>
				)}
				{canDeploy &&
					(data?.composeType === "docker-compose" &&
					data?.composeStatus === "idle" ? (
						<DialogAction
							title="Compose Başlat"
							description="Bu compose'u başlatmak istediğinizden emin misiniz?"
							type="default"
							onClick={async () => {
								await start({
									composeId: composeId,
								})
									.then(() => {
										toast.success("Compose başarıyla başlatıldı");
										refetch();
									})
									.catch(() => {
										toast.error("Compose başlatılırken hata oluştu");
									});
							}}
						>
							<Button
								variant="secondary"
								isLoading={isStarting}
								className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
												Compose'u başlat (önceden başarılı bir derleme gerektirir)
											</p>
										</TooltipContent>
									</TooltipPrimitive.Portal>
								</Tooltip>
							</Button>
						</DialogAction>
					) : (
						<DialogAction
							title="Compose Durdur"
							description="Bu compose'u durdurmak istediğinizden emin misiniz?"
							onClick={async () => {
								await stop({
									composeId: composeId,
								})
									.then(() => {
										toast.success("Compose başarıyla durduruldu");
										refetch();
									})
									.catch(() => {
										toast.error("Compose durdurulurken hata oluştu");
									});
							}}
						>
							<Button
								variant="destructive"
								isLoading={isStopping}
								className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
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
											<p>Çalışmakta olan compose'u durdur</p>
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
				appType={data?.composeType || "docker-compose"}
			>
				<Button
					variant="outline"
					className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
				>
					<Terminal className="size-4 mr-1" />
					Terminal Aç
				</Button>
			</DockerTerminalModal>
			{canUpdateService && (
				<div className="flex flex-row items-center gap-2 rounded-md px-4 py-2 border">
					<span className="text-sm font-medium">Otomatik Dağıtım</span>
					<Switch
						aria-label="Otomatik dağıtımı aç/kapat"
						checked={data?.autoDeploy || false}
						onCheckedChange={async (enabled) => {
							await update({
								composeId,
								autoDeploy: enabled,
							})
								.then(async () => {
									toast.success("Otomatik Dağıtım güncellendi");
									await refetch();
								})
								.catch(() => {
									toast.error("Otomatik Dağıtım güncellenirken hata oluştu");
								});
						}}
						className="flex flex-row gap-2 items-center data-[state=checked]:bg-primary"
					/>
				</div>
			)}
		</div>
	);
};
