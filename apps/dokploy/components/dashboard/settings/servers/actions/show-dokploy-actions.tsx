import { toast } from "sonner";
import { UpdateServerIp } from "@/components/dashboard/settings/web-server/update-server-ip";
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
import { api } from "@/utils/api";
import { ShowModalLogs } from "../../web-server/show-modal-logs";
import { TerminalModal } from "../../web-server/terminal-modal";
import { GPUSupportModal } from "../gpu-support-modal";

export const ShowDokployActions = () => {
	const { mutateAsync: reloadServer, isPending } =
		api.settings.reloadServer.useMutation();

	const { mutateAsync: cleanRedis } = api.settings.cleanRedis.useMutation();
	const { mutateAsync: reloadRedis } = api.settings.reloadRedis.useMutation();
	const { mutateAsync: cleanAllDeploymentQueue } =
		api.settings.cleanAllDeploymentQueue.useMutation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild disabled={isPending}>
				<Button isLoading={isPending} variant="outline">
					Sunucu
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="start">
				<DropdownMenuLabel>İşlemler</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						onClick={async () => {
							await reloadServer()
								.then(async () => {
									toast.success("Sunucu Yeniden Yüklendi");
								})
								.catch(() => {
									toast.success("Sunucu Yeniden Yüklendi");
								});
						}}
						className="cursor-pointer"
					>
						<span>Yeniden Yükle</span>
					</DropdownMenuItem>
					<TerminalModal serverId="local">
						<span>Terminal</span>
					</TerminalModal>
					<ShowModalLogs appName="dokploy">
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={(e) => e.preventDefault()}
						>
							Günlükleri Görüntüle
						</DropdownMenuItem>
					</ShowModalLogs>
					<GPUSupportModal />
					<UpdateServerIp>
						<DropdownMenuItem
							className="cursor-pointer"
							onSelect={(e) => e.preventDefault()}
						>
							Sunucu IP'sini Güncelle
						</DropdownMenuItem>
					</UpdateServerIp>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await cleanRedis()
								.then(async () => {
									toast.success("Redis temizlendi");
								})
								.catch(() => {
									toast.error("Redis temizlenirken hata oluştu");
								});
						}}
					>
						Redis'i Temizle
					</DropdownMenuItem>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await cleanAllDeploymentQueue()
								.then(() => {
									toast.success("Dağıtım kuyruğu temizlendi");
								})
								.catch(() => {
									toast.error("Dağıtım kuyruğu temizlenirken hata oluştu");
								});
						}}
					>
						Tüm dağıtım kuyruğunu temizle
					</DropdownMenuItem>

					<DropdownMenuItem
						className="cursor-pointer"
						onClick={async () => {
							await reloadRedis()
								.then(async () => {
									toast.success("Redis yeniden yüklendi");
								})
								.catch(() => {
									toast.error("Redis yeniden yüklenirken hata oluştu");
								});
						}}
					>
						Redis'i Yeniden Yükle
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
