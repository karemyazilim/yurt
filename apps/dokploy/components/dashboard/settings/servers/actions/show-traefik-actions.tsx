import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHealthCheckAfterMutation } from "@/hooks/use-health-check-after-mutation";
import { api } from "@/utils/api";
import { EditTraefikEnv } from "../../web-server/edit-traefik-env";
import { ManageTraefikPorts } from "../../web-server/manage-traefik-ports";
import { ShowModalLogs } from "../../web-server/show-modal-logs";

interface Props {
	serverId?: string;
}
export const ShowTraefikActions = ({ serverId }: Props) => {
	const { mutateAsync: reloadTraefik, isPending: reloadTraefikIsLoading } =
		api.settings.reloadTraefik.useMutation();

	const { mutateAsync: toggleDashboard, isPending: toggleDashboardIsLoading } =
		api.settings.toggleDashboard.useMutation();

	const { data: haveTraefikDashboardPortEnabled, refetch: refetchDashboard } =
		api.settings.haveTraefikDashboardPortEnabled.useQuery({
			serverId,
		});

	const {
		execute: executeWithHealthCheck,
		isExecuting: isHealthCheckExecuting,
	} = useHealthCheckAfterMutation({
		initialDelay: 5000,
		pollInterval: 4000,
		successMessage: "Traefik panosu başarıyla güncellendi",
		onSuccess: () => {
			refetchDashboard();
		},
	});

	const {
		execute: executeReloadWithHealthCheck,
		isExecuting: isReloadHealthCheckExecuting,
	} = useHealthCheckAfterMutation({
		initialDelay: 5000,
		pollInterval: 4000,
		successMessage: "Traefik Yeniden Yüklendi",
	});

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				asChild
				disabled={
					reloadTraefikIsLoading ||
					toggleDashboardIsLoading ||
					isHealthCheckExecuting ||
					isReloadHealthCheckExecuting
				}
			>
				<Button
					isLoading={
						reloadTraefikIsLoading ||
						toggleDashboardIsLoading ||
						isHealthCheckExecuting ||
						isReloadHealthCheckExecuting
					}
					variant="outline"
				>
					Traefik
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="start">
				<DropdownMenuLabel>İşlemler</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={async () => {
							try {
								await executeReloadWithHealthCheck(() =>
									reloadTraefik({ serverId }),
								);
							} catch (error) {
								const errorMessage =
									(error as Error)?.message ||
									"Traefik yeniden yüklenemedi. Lütfen tekrar deneyin.";
								toast.error(errorMessage);
							}
						}}
						className="cursor-pointer"
						disabled={isReloadHealthCheckExecuting}
					>
						<span>Yeniden Yükle</span>
					</DropdownMenuItem>
					<ShowModalLogs
						appName="dokploy-traefik"
						serverId={serverId}
						type="standalone"
					>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="cursor-pointer"
						>
							Günlükleri Görüntüle
						</DropdownMenuItem>
					</ShowModalLogs>
					<EditTraefikEnv serverId={serverId}>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="cursor-pointer"
						>
							<span>Ortam Değişkenlerini Düzenle</span>
						</DropdownMenuItem>
					</EditTraefikEnv>

					<DialogAction
						title={
							haveTraefikDashboardPortEnabled
								? "Traefik Panosunu Devre Dışı Bırak"
								: "Traefik Panosunu Etkinleştir"
						}
						description={
							<div className="space-y-4">
								<AlertBlock type="warning">
									Traefik konteyneri sıfırdan yeniden oluşturulacaktır. Bu,
									konteynerin silinip tekrar oluşturulacağı anlamına gelir ve
									uygulamalarınızda kesintiye neden olabilir.
								</AlertBlock>
								<p>
									Traefik panosunu{" "}
									{haveTraefikDashboardPortEnabled ? "devre dışı bırakmak" : "etkinleştirmek"}
									istediğinizden emin misiniz?
								</p>
							</div>
						}
						onClick={async () => {
							try {
								await executeWithHealthCheck(() =>
									toggleDashboard({
										enableDashboard: !haveTraefikDashboardPortEnabled,
										serverId: serverId,
									}),
								);
							} catch (error) {
								const errorMessage =
									(error as Error)?.message ||
									"Pano değiştirilemedi. Lütfen 8080 portunun kullanılabilir olduğunu kontrol edin.";
								toast.error(errorMessage);
							}
						}}
						disabled={toggleDashboardIsLoading || isHealthCheckExecuting}
						type="default"
					>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="w-full cursor-pointer space-x-3"
						>
							<span>
								{haveTraefikDashboardPortEnabled ? "Devre Dışı Bırak" : "Etkinleştir"}{" "}
								Pano
							</span>
						</DropdownMenuItem>
					</DialogAction>
					<ManageTraefikPorts serverId={serverId}>
						<DropdownMenuItem
							onSelect={(e) => e.preventDefault()}
							className="cursor-pointer"
						>
							<span>Ek Port Eşlemeleri</span>
						</DropdownMenuItem>
					</ManageTraefikPorts>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
