import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

const Terminal = dynamic(
	() => import("./docker-terminal").then((e) => e.DockerTerminal),
	{
		ssr: false,
	},
);

interface Props {
	containerId: string;
	serverId?: string;
	children?: React.ReactNode;
}

export const DockerTerminalModal = ({
	children,
	containerId,
	serverId,
}: Props) => {
	const [mainDialogOpen, setMainDialogOpen] = useState(false);
	const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

	const handleMainDialogOpenChange = (open: boolean) => {
		if (!open) {
			setConfirmDialogOpen(true);
		} else {
			setMainDialogOpen(true);
		}
	};

	const handleConfirm = () => {
		setConfirmDialogOpen(false);
		setMainDialogOpen(false);
	};

	const handleCancel = () => {
		setConfirmDialogOpen(false);
	};
	return (
		<Dialog open={mainDialogOpen} onOpenChange={handleMainDialogOpenChange}>
			<DialogTrigger asChild>
				<DropdownMenuItem
					className="w-full cursor-pointer space-x-3"
					onSelect={(e) => e.preventDefault()}
				>
					{children}
				</DropdownMenuItem>
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-7xl"
				onEscapeKeyDown={(event) => event.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Docker Terminal</DialogTitle>
					<DialogDescription>
						Docker konteynerine kolay erişim yolu
					</DialogDescription>
				</DialogHeader>

				<Terminal
					id="terminal"
					containerId={containerId}
					serverId={serverId || ""}
				/>
				<Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
					<DialogContent onEscapeKeyDown={(event) => event.preventDefault()}>
						<DialogHeader>
							<DialogTitle>
								Terminali kapatmak istediğinize emin misiniz?
							</DialogTitle>
							<DialogDescription>
								Onayla butonuna tıkladığınızda terminal kapatılacaktır.
							</DialogDescription>
						</DialogHeader>
						<DialogFooter>
							<Button variant="outline" onClick={handleCancel}>
								İptal
							</Button>
							<Button onClick={handleConfirm}>Onayla</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</DialogContent>
		</Dialog>
	);
};
