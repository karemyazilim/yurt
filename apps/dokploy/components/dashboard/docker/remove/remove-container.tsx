import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { api } from "@/utils/api";

interface Props {
	containerId: string;
	serverId?: string;
}

export const RemoveContainerDialog = ({ containerId, serverId }: Props) => {
	const utils = api.useUtils();
	const { mutateAsync, isPending } = api.docker.removeContainer.useMutation();

	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer text-red-500 hover:!text-red-600"
					onSelect={(e) => e.preventDefault()}
				>
					Konteyneri Kaldır
				</DropdownMenuItem>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Emin misiniz?</AlertDialogTitle>
					<AlertDialogDescription>
						Bu işlem{" "}
						<span className="font-semibold">{containerId}</span> konteynerini kalıcı olarak kaldıracaktır. Konteyner çalışıyorsa, zorla durdurulup kaldırılacaktır.
						Bu işlem geri alınamaz.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>İptal</AlertDialogCancel>
					<AlertDialogAction
						disabled={isPending}
						onClick={async () => {
							await mutateAsync({ containerId, serverId })
								.then(async () => {
									toast.success("Konteyner başarıyla kaldırıldı");
									await utils.docker.getContainers.invalidate();
								})
								.catch((err) => {
									toast.error(err.message);
								});
						}}
					>
						Onayla
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
