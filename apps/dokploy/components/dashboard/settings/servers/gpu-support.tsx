import { CheckCircle2, Cpu, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/utils/api";

interface GPUSupportProps {
	serverId?: string;
}

export function GPUSupport({ serverId }: GPUSupportProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const utils = api.useContext();

	const {
		data: gpuStatus,
		isLoading: isChecking,
		refetch,
	} = api.settings.checkGPUStatus.useQuery(
		{ serverId },
		{
			enabled: serverId !== undefined,
		},
	);

	const setupGPU = api.settings.setupGPU.useMutation({
		onMutate: () => {
			setIsLoading(true);
		},
		onSuccess: async () => {
			toast.success("GPU desteği başarıyla etkinleştirildi");
			setIsLoading(false);
			await utils.settings.checkGPUStatus.invalidate({ serverId });
		},
		onError: (error) => {
			toast.error(
				error.message ||
					"GPU desteği etkinleştirilemedi. Lütfen sunucu günlüklerini kontrol edin.",
			);
			setIsLoading(false);
		},
	});

	const handleRefresh = async () => {
		setIsRefreshing(true);
		try {
			await utils.settings.checkGPUStatus.invalidate({ serverId });
			await refetch();
		} catch {
			toast.error("GPU durumu yenilenemedi");
		} finally {
			setIsRefreshing(false);
		}
	};
	useEffect(() => {
		handleRefresh();
	}, []);

	const handleEnableGPU = async () => {
		if (serverId === undefined) {
			toast.error("Sunucu seçilmedi");
			return;
		}

		try {
			await setupGPU.mutateAsync({ serverId });
		} catch {
			// Error handling is done in mutation's onError
		}
	};

	return (
		<CardContent className="p-0">
			<div className="flex flex-col gap-4">
				<Card className="bg-background">
					<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
						<div className="flex flex-row gap-2 justify-between w-full items-end max-sm:flex-col">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<Cpu className="size-5" />
									<CardTitle className="text-xl">GPU Yapılandırması</CardTitle>
								</div>
								<CardDescription>
									GPU desteğini yapılandırın ve izleyin
								</CardDescription>
							</div>
							<div className="flex items-center gap-2">
								<DialogAction
									title="GPU Desteği Etkinleştirilsin mi?"
									description="Bu işlem bu sunucuda Docker Swarm için GPU desteğini etkinleştirecektir. Gerekli donanım ve sürücülerin kurulu olduğundan emin olun."
									onClick={handleEnableGPU}
								>
									<Button
										isLoading={isLoading}
										disabled={isLoading || serverId === undefined || isChecking}
									>
										{isLoading
											? "Yükleniyor..."
											: gpuStatus?.swarmEnabled
												? "GPU'yu Yeniden Yapılandır"
												: "GPU'yu Etkinleştir"}
									</Button>
								</DialogAction>
								<Button
									size="icon"
									onClick={handleRefresh}
									disabled={isChecking || isRefreshing}
								>
									<RefreshCw
										className={`h-5 w-5 ${isChecking || isRefreshing ? "animate-spin" : ""}`}
									/>
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-4">
						<AlertBlock type="info">
							<div className="font-medium mb-2">Sistem Gereksinimleri:</div>
							<ul className="list-disc list-inside text-sm space-y-1">
								<li>NVIDIA GPU donanımı fiziksel olarak kurulu olmalıdır</li>
								<li>
									NVIDIA sürücüleri kurulu ve çalışır durumda olmalıdır (nvidia-smi
									ile kontrol edin)
								</li>
								<li>
									NVIDIA Container Runtime kurulu olmalıdır
									(nvidia-container-runtime)
								</li>
								<li>Kullanıcının sudo/yönetici ayrıcalıkları olmalıdır</li>
								<li>Sistem GPU hızlandırma için CUDA desteklemelidir</li>
							</ul>
						</AlertBlock>

						{isChecking ? (
							<div className="flex items-center justify-center text-muted-foreground py-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span>GPU durumu kontrol ediliyor...</span>
							</div>
						) : (
							<div className="grid gap-4">
								{/* Prerequisites Section */}
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">Ön Koşullar</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Tüm yazılım kontrollerini ve mevcut donanımı gösterir
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label="NVIDIA Sürücüsü"
											isEnabled={gpuStatus?.driverInstalled}
											description={
												gpuStatus?.driverVersion
													? `Kurulu (v${gpuStatus.driverVersion})`
													: "Kurulu Değil"
											}
										/>
										<StatusRow
											label="GPU Modeli"
											value={gpuStatus?.gpuModel || "Algılanmadı"}
											showIcon={false}
										/>
										<StatusRow
											label="GPU Belleği"
											value={gpuStatus?.memoryInfo || "Mevcut Değil"}
											showIcon={false}
										/>
										<StatusRow
											label="Kullanılabilir GPU'lar"
											value={gpuStatus?.availableGPUs || 0}
											showIcon={false}
										/>
										<StatusRow
											label="CUDA Desteği"
											isEnabled={gpuStatus?.cudaSupport}
											description={
												gpuStatus?.cudaVersion
													? `Mevcut (v${gpuStatus.cudaVersion})`
													: "Mevcut Değil"
											}
										/>
										<StatusRow
											label="NVIDIA Container Runtime"
											isEnabled={gpuStatus?.runtimeInstalled}
											description={
												gpuStatus?.runtimeInstalled
													? "Kurulu"
													: "Kurulu Değil"
											}
										/>
									</div>
								</div>

								{/* Configuration Status */}
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">
										Docker Swarm GPU Durumu
									</h3>
									<p className="text-sm text-muted-foreground mb-4">
										GPU Etkinleştir ile değişen yapılandırma durumunu
										gösterir
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label="Runtime Yapılandırması"
											isEnabled={gpuStatus?.runtimeConfigured}
											description={
												gpuStatus?.runtimeConfigured
													? "Varsayılan Runtime"
													: "Varsayılan Runtime Değil"
											}
										/>
										<StatusRow
											label="Swarm GPU Desteği"
											isEnabled={gpuStatus?.swarmEnabled}
											description={
												gpuStatus?.swarmEnabled
													? `Etkin (${gpuStatus.gpuResources} GPU)`
													: "Etkin Değil"
											}
										/>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</CardContent>
	);
}

interface StatusRowProps {
	label: string;
	isEnabled?: boolean;
	description?: string;
	value?: string | number;
	showIcon?: boolean;
}

export function StatusRow({
	label,
	isEnabled,
	description,
	value,
	showIcon = true,
}: StatusRowProps) {
	return (
		<div className="flex items-center justify-between">
			<span className="text-sm">{label}</span>
			<div className="flex items-center gap-2">
				{showIcon ? (
					<>
						<span
							className={`text-sm ${isEnabled ? "text-green-500" : "text-red-500"}`}
						>
							{description || (isEnabled ? "Kurulu" : "Kurulu Değil")}
						</span>
						{isEnabled ? (
							<CheckCircle2 className="size-4 text-green-500" />
						) : (
							<XCircle className="size-4 text-red-500" />
						)}
					</>
				) : (
					<span className="text-sm text-muted-foreground">{value}</span>
				)}
			</div>
		</div>
	);
}
