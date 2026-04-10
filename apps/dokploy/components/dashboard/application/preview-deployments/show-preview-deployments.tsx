import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
	ExternalLink,
	FileText,
	GitPullRequest,
	Hammer,
	Loader2,
	PenSquare,
	RocketIcon,
	Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { GithubIcon } from "@/components/icons/data-tools-icons";
import { DateTooltip } from "@/components/shared/date-tooltip";
import { DialogAction } from "@/components/shared/dialog-action";
import { StatusTooltip } from "@/components/shared/status-tooltip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { ShowModalLogs } from "../../settings/web-server/show-modal-logs";
import { ShowDeploymentsModal } from "../deployments/show-deployments-modal";
import { AddPreviewDomain } from "./add-preview-domain";
import { ShowPreviewSettings } from "./show-preview-settings";

interface Props {
	applicationId: string;
}

export const ShowPreviewDeployments = ({ applicationId }: Props) => {
	const { data } = api.application.one.useQuery({ applicationId });

	const { mutateAsync: deletePreviewDeployment, isPending } =
		api.previewDeployment.delete.useMutation();

	const { mutateAsync: redeployPreviewDeployment } =
		api.previewDeployment.redeploy.useMutation();

	const {
		data: previewDeployments,
		refetch: refetchPreviewDeployments,
		isLoading: isLoadingPreviewDeployments,
	} = api.previewDeployment.all.useQuery(
		{ applicationId },
		{
			enabled: !!applicationId,
			refetchInterval: 2000,
		},
	);

	const handleDeletePreviewDeployment = async (previewDeploymentId: string) => {
		deletePreviewDeployment({
			previewDeploymentId: previewDeploymentId,
		})
			.then(() => {
				refetchPreviewDeployments();
				toast.success("Önizleme dağıtımı silindi");
			})
			.catch((error) => {
				toast.error(error.message);
			});
	};

	return (
		<Card className="bg-background">
			<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
				<div className="flex flex-col gap-2">
					<CardTitle className="text-xl">Önizleme Dağıtımları</CardTitle>
					<CardDescription>Tüm önizleme dağıtımlarını görüntüleyin</CardDescription>
				</div>
				{data?.isPreviewDeploymentsActive && (
					<ShowPreviewSettings applicationId={applicationId} />
				)}
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{data?.isPreviewDeploymentsActive ? (
					<>
						<div className="flex flex-col gap-2 text-sm">
							<span>
								Önizleme dağıtımları, uygulamanızı üretime dağıtmadan önce test
								etmenin bir yoludur. Oluşturduğunuz her pull request için yeni bir
								dağıtım oluşturacaktır.
							</span>
						</div>
						{isLoadingPreviewDeployments ? (
							<div className="flex w-full flex-row items-center justify-center gap-3 min-h-[35vh]">
								<Loader2 className="size-5 text-muted-foreground animate-spin" />
								<span className="text-base text-muted-foreground">
									Önizleme dağıtımları yükleniyor...
								</span>
							</div>
						) : !previewDeployments?.length ? (
							<div className="flex w-full flex-col items-center justify-center gap-3 min-h-[35vh]">
								<RocketIcon className="size-8 text-muted-foreground" />
								<span className="text-base text-muted-foreground">
									Önizleme dağıtımı bulunamadı
								</span>
							</div>
						) : (
							<div className="flex flex-col gap-4">
								{previewDeployments?.map((deployment) => {
									const deploymentUrl = `${deployment.domain?.https ? "https" : "http"}://${deployment.domain?.host}${deployment.domain?.path || "/"}`;
									const status = deployment.previewStatus;
									return (
										<div
											key={deployment.previewDeploymentId}
											className="group relative overflow-hidden border rounded-lg transition-colors"
										>
											<div
												className={`absolute left-0 top-0 w-1 h-full ${
													status === "done"
														? "bg-green-500"
														: status === "running"
															? "bg-yellow-500"
															: "bg-red-500"
												}`}
											/>

											<div className="p-4">
												<div className="flex items-start justify-between mb-3">
													<div className="flex items-start gap-3">
														<GitPullRequest className="size-5 text-muted-foreground mt-1 flex-shrink-0" />
														<div>
															<div className="font-medium text-sm">
																{deployment.pullRequestTitle}
															</div>
															<div className="text-sm text-muted-foreground mt-1">
																{deployment.branch}
															</div>
														</div>
													</div>
													<Badge variant="outline" className="gap-2">
														<StatusTooltip
															status={deployment.previewStatus}
															className="size-2"
														/>
														<DateTooltip date={deployment.createdAt} />
													</Badge>
												</div>

												<div className="pl-8 space-y-3">
													<div className="relative flex-grow">
														<Input
															value={deploymentUrl}
															readOnly
															className="pr-8 text-sm text-blue-500 hover:text-blue-600 cursor-pointer"
															onClick={() =>
																window.open(deploymentUrl, "_blank")
															}
														/>
														<ExternalLink className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
													</div>

													<div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
														<Button
															variant="outline"
															size="sm"
															className="gap-2"
															onClick={() =>
																window.open(deployment.pullRequestURL, "_blank")
															}
														>
															<GithubIcon className="size-4" />
															Pull Request
														</Button>
														<ShowModalLogs
															appName={deployment.appName}
															serverId={data?.serverId || ""}
														>
															<Button
																variant="outline"
																size="sm"
																className="gap-2"
															>
																<FileText className="size-4" />
																Günlükler
															</Button>
														</ShowModalLogs>

														<ShowDeploymentsModal
															id={deployment.previewDeploymentId}
															type="previewDeployment"
															serverId={data?.serverId || ""}
														>
															<Button
																variant="outline"
																size="sm"
																className="gap-2"
															>
																<RocketIcon className="size-4" />
																Dağıtımlar
															</Button>
														</ShowDeploymentsModal>

														<DialogAction
															title="Önizleme Dağıtımını Yeniden Oluştur"
															description="Bu önizleme dağıtımını yeniden oluşturmak istediğinizden emin misiniz?"
															type="default"
															onClick={async () => {
																await redeployPreviewDeployment({
																	previewDeploymentId:
																		deployment.previewDeploymentId,
																})
																	.then(() => {
																		toast.success(
																			"Önizleme dağıtımı yeniden oluşturma başlatıldı",
																		);
																		refetchPreviewDeployments();
																	})
																	.catch(() => {
																		toast.error(
																			"Önizleme dağıtımı yeniden oluşturulurken hata oluştu",
																		);
																	});
															}}
														>
															<Button
																variant="outline"
																size="sm"
																isLoading={status === "running"}
																className="gap-2"
															>
																<TooltipProvider>
																	<Tooltip>
																		<TooltipTrigger asChild>
																			<div className="flex items-center gap-2">
																				<Hammer className="size-4" />
																				Yeniden Oluştur
																			</div>
																		</TooltipTrigger>
																		<TooltipPrimitive.Portal>
																			<TooltipContent
																				sideOffset={5}
																				className="z-[60]"
																			>
																				<p>
																					Yeni kod indirmeden önizleme dağıtımını
																					yeniden oluştur
																				</p>
																			</TooltipContent>
																		</TooltipPrimitive.Portal>
																	</Tooltip>
																</TooltipProvider>
															</Button>
														</DialogAction>

														<AddPreviewDomain
															previewDeploymentId={`${deployment.previewDeploymentId}`}
															domainId={deployment.domain?.domainId}
														>
															<Button
																variant="ghost"
																size="sm"
																className="gap-2"
															>
																<PenSquare className="size-4" />
															</Button>
														</AddPreviewDomain>
														<DialogAction
															title="Önizlemeyi Sil"
															description="Bu önizlemeyi silmek istediğinizden emin misiniz?"
															onClick={() =>
																handleDeletePreviewDeployment(
																	deployment.previewDeploymentId,
																)
															}
														>
															<Button
																variant="ghost"
																size="sm"
																isLoading={isPending}
																className="text-red-600 hover:text-red-700 hover:bg-red-50"
															>
																<Trash2 className="size-4" />
															</Button>
														</DialogAction>
													</div>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</>
				) : (
					<div className="flex w-full flex-col items-center justify-center gap-3 pt-10">
						<RocketIcon className="size-8 text-muted-foreground" />
						<span className="text-base text-muted-foreground">
							Bu uygulama için önizleme dağıtımları devre dışı, lütfen
							etkinleştirin
						</span>
						<ShowPreviewSettings applicationId={applicationId} />
					</div>
				)}
			</CardContent>
		</Card>
	);
};
