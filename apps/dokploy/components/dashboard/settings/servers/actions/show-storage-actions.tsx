import { toast } from "sonner";
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

interface Props {
	serverId?: string;
}
export const ShowStorageActions = ({ serverId }: Props) => {
	const { mutateAsync: cleanAll, isPending: cleanAllIsLoading } =
		api.settings.cleanAll.useMutation();

	const {
		mutateAsync: cleanDockerBuilder,
		isPending: cleanDockerBuilderIsPending,
	} = api.settings.cleanDockerBuilder.useMutation();

	const { mutateAsync: cleanMonitoring } =
		api.settings.cleanMonitoring.useMutation();
	const {
		mutateAsync: cleanUnusedImages,
		isPending: cleanUnusedImagesIsPending,
	} = api.settings.cleanUnusedImages.useMutation();

	const {
		mutateAsync: cleanUnusedVolumes,
		isPending: cleanUnusedVolumesIsPending,
	} = api.settings.cleanUnusedVolumes.useMutation();

	const {
		mutateAsync: cleanStoppedContainers,
		isPending: cleanStoppedContainersIsPending,
	} = api.settings.cleanStoppedContainers.useMutation();

	const { mutateAsync: cleanPatchRepos, isPending: cleanPatchReposIsLoading } =
		api.patch.cleanPatchRepos.useMutation();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				asChild
				disabled={
					cleanAllIsLoading ||
					cleanDockerBuilderIsPending ||
					cleanUnusedImagesIsPending ||
					cleanUnusedVolumesIsPending ||
					cleanStoppedContainersIsPending ||
					cleanPatchReposIsLoading
				}
			>
				<Button
					isLoading={
						cleanAllIsLoading ||
						cleanDockerBuilderIsPending ||
						cleanUnusedImagesIsPending ||
						cleanUnusedVolumesIsPending ||
						cleanStoppedContainersIsPending ||
						cleanPatchReposIsLoading
					}
					variant="outline"
				>
					Depolama
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-64" align="start">
				<DropdownMenuLabel>İşlemler</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={async () => {
							await cleanUnusedImages({
								serverId: serverId,
							})
								.then(async () => {
									toast.success("İmajlar temizlendi");
								})
								.catch(() => {
									toast.error("İmajlar temizlenirken hata oluştu");
								});
						}}
					>
						<span>Kullanılmayan imajları temizle</span>
					</DropdownMenuItem>
					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={async () => {
							await cleanUnusedVolumes({
								serverId: serverId,
							})
								.then(async () => {
									toast.success("Birimler temizlendi");
								})
								.catch(() => {
									toast.error("Birimler temizlenirken hata oluştu");
								});
						}}
					>
						<span>Kullanılmayan birimleri temizle</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={async () => {
							await cleanStoppedContainers({
								serverId: serverId,
							})
								.then(async () => {
									toast.success("Durdurulan konteynerler temizlendi");
								})
								.catch(() => {
									toast.error("Durdurulan konteynerler temizlenirken hata oluştu");
								});
						}}
					>
						<span>Durdurulan konteynerleri temizle</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={async () => {
							await cleanPatchRepos({
								serverId: serverId,
							})
								.then(async () => {
									toast.success("Yama Önbellekleri temizlendi");
								})
								.catch(() => {
									toast.error("Yama Önbellekleri temizlenirken hata oluştu");
								});
						}}
					>
						<span>Yama Önbelleklerini Temizle</span>
					</DropdownMenuItem>

					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={async () => {
							await cleanDockerBuilder({
								serverId: serverId,
							})
								.then(async () => {
									toast.success("Docker Builder temizlendi");
								})
								.catch(() => {
									toast.error("Docker Builder temizlenirken hata oluştu");
								});
						}}
					>
						<span>Docker Builder ve Sistemi Temizle</span>
					</DropdownMenuItem>
					{!serverId && (
						<DropdownMenuItem
							className="w-full cursor-pointer"
							onClick={async () => {
								await cleanMonitoring()
									.then(async () => {
										toast.success("İzleme verileri temizlendi");
									})
									.catch(() => {
										toast.error("İzleme verileri temizlenirken hata oluştu");
									});
							}}
						>
							<span>İzleme Verilerini Temizle</span>
						</DropdownMenuItem>
					)}

					<DropdownMenuItem
						className="w-full cursor-pointer"
						onClick={async () => {
							await cleanAll({
								serverId: serverId,
							})
								.then(async () => {
									toast.success("Temizleme devam ediyor... Lütfen bekleyin");
								})
								.catch(() => {
									toast.error("Tümü temizlenirken hata oluştu");
								});
						}}
					>
						<span>Tümünü temizle</span>
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
