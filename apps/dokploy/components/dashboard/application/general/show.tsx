import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
	Ban,
	CheckCircle2,
	Hammer,
	RefreshCcw,
	Rocket,
	Terminal,
} from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ShowBuildChooseForm } from "@/components/dashboard/application/build/show";
import { ShowProviderForm } from "@/components/dashboard/application/general/generic/show";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
	applicationId: string;
}

export const ShowGeneralApplication = ({ applicationId }: Props) => {
	const router = useRouter();
	const { data: permissions } = api.user.getPermissions.useQuery();
	const canDeploy = permissions?.deployment.create ?? false;
	const canUpdateService = permissions?.service.create ?? false;
	const { data, refetch } = api.application.one.useQuery(
		{
			applicationId,
		},
		{ enabled: !!applicationId },
	);
	const { mutateAsync: update } = api.application.update.useMutation();
	const { mutateAsync: start, isPending: isStarting } =
		api.application.start.useMutation();
	const { mutateAsync: stop, isPending: isStopping } =
		api.application.stop.useMutation();

	const { mutateAsync: deploy } = api.application.deploy.useMutation();

	const { mutateAsync: reload, isPending: isReloading } =
		api.application.reload.useMutation();

	const { mutateAsync: redeploy } = api.application.redeploy.useMutation();

	return (
		<>
			<Card className="bg-background">
				<CardHeader>
					<CardTitle className="text-xl">Dağıtım Ayarları</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-row gap-4 flex-wrap">
					<TooltipProvider delayDuration={0} disableHoverableContent={false}>
						{canDeploy && (
							<DialogAction
								title="Uygulamayı Dağıt"
								description="Bu uygulamayı dağıtmak istediğinizden emin misiniz?"
								type="default"
								onClick={async () => {
									await deploy({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Uygulama başarıyla dağıtıldı");
											refetch();
											router.push(
												`/dashboard/project/${data?.environment.projectId}/environment/${data?.environmentId}/services/application/${applicationId}?tab=deployments`,
											);
										})
										.catch(() => {
											toast.error("Uygulama dağıtılırken hata oluştu");
										});
								}}
							>
								<Button
									variant="default"
									isLoading={data?.applicationStatus === "running"}
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
													Kaynak kodunu indirir ve tam bir derleme
													gerçekleştirir
												</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}
						{canDeploy && (
							<DialogAction
								title="Uygulamayı Yeniden Yükle"
								description="Bu uygulamayı yeniden yüklemek istediğinizden emin misiniz?"
								type="default"
								onClick={async () => {
									await reload({
										applicationId: applicationId,
										appName: data?.appName || "",
									})
										.then(() => {
											toast.success("Uygulama başarıyla yeniden yüklendi");
											refetch();
										})
										.catch(() => {
											toast.error("Uygulama yeniden yüklenirken hata oluştu");
										});
								}}
							>
								<Button
									variant="secondary"
									isLoading={isReloading}
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
												<p>Uygulamayı yeniden derlemeden yeniden yükle</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}
						{canDeploy && (
							<DialogAction
								title="Uygulamayı Yeniden Derle"
								description="Bu uygulamayı yeniden derlemek istediğinizden emin misiniz?"
								type="default"
								onClick={async () => {
									await redeploy({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Uygulama başarıyla yeniden derlendi");
											refetch();
										})
										.catch(() => {
											toast.error("Uygulama yeniden derlenirken hata oluştu");
										});
								}}
							>
								<Button
									variant="secondary"
									isLoading={data?.applicationStatus === "running"}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<Hammer className="size-4 mr-1" />
												Yeniden Derle
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>
													Yeni kod indirmeden yalnızca uygulamayı yeniden
													derler
												</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}

						{canDeploy && data?.applicationStatus === "idle" ? (
							<DialogAction
								title="Uygulamayı Başlat"
								description="Bu uygulamayı başlatmak istediğinizden emin misiniz?"
								type="default"
								onClick={async () => {
									await start({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Uygulama başarıyla başlatıldı");
											refetch();
										})
										.catch(() => {
											toast.error("Uygulama başlatılırken hata oluştu");
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
													Uygulamayı başlat (önceden başarılı bir derleme
													gerektirir)
												</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						) : canDeploy ? (
							<DialogAction
								title="Uygulamayı Durdur"
								description="Bu uygulamayı durdurmak istediğinizden emin misiniz?"
								onClick={async () => {
									await stop({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Uygulama başarıyla durduruldu");
											refetch();
										})
										.catch(() => {
											toast.error("Uygulama durdurulurken hata oluştu");
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
												<p>Çalışmakta olan uygulamayı durdur</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						) : null}
					</TooltipProvider>
					<DockerTerminalModal
						appName={data?.appName || ""}
						serverId={data?.serverId || ""}
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
										applicationId,
										autoDeploy: enabled,
									})
										.then(async () => {
											toast.success("Otomatik Dağıtım Güncellendi");
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

					{canUpdateService && (
						<div className="flex flex-row items-center gap-2 rounded-md px-4 py-2 border">
							<span className="text-sm font-medium">Önbelleği Temizle</span>
							<Switch
								aria-label="Önbellek temizlemeyi aç/kapat"
								checked={data?.cleanCache || false}
								onCheckedChange={async (enabled) => {
									await update({
										applicationId,
										cleanCache: enabled,
									})
										.then(async () => {
											toast.success("Önbellek Temizleme Güncellendi");
											await refetch();
										})
										.catch(() => {
											toast.error("Önbellek Temizleme güncellenirken hata oluştu");
										});
								}}
								className="flex flex-row gap-2 items-center data-[state=checked]:bg-primary"
							/>
						</div>
					)}
				</CardContent>
			</Card>
			<ShowProviderForm applicationId={applicationId} />
			<ShowBuildChooseForm applicationId={applicationId} />
		</>
	);
};
