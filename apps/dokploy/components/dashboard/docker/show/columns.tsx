import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShowContainerConfig } from "../config/show-container-config";
import { ShowDockerModalLogs } from "../logs/show-docker-modal-logs";
import { RemoveContainerDialog } from "../remove/remove-container";
import { DockerTerminalModal } from "../terminal/docker-terminal-modal";
import { UploadFileModal } from "../upload/upload-file-modal";
import type { Container } from "./show-containers";

export const columns: ColumnDef<Container>[] = [
	{
		accessorKey: "name",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Ad
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("name")}</div>;
		},
	},
	{
		accessorKey: "state",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Durum
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.getValue("state") as string;
			return (
				<div className="capitalize">
					<Badge
						variant={
							value === "running"
								? "default"
								: value === "failed"
									? "destructive"
									: "secondary"
						}
					>
						{value}
					</Badge>
				</div>
			);
		},
	},
	{
		accessorKey: "status",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Durum Bilgisi
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div className="capitalize">{row.getValue("status")}</div>;
		},
	},
	{
		accessorKey: "image",
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					İmaj
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => <div className="lowercase">{row.getValue("image")}</div>,
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row }) => {
			const container = row.original;

			return (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" className="h-8 w-8 p-0">
							<span className="sr-only">Menüyü aç</span>
							<MoreHorizontal className="h-4 w-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>İşlemler</DropdownMenuLabel>
						<ShowDockerModalLogs
							containerId={container.containerId}
							serverId={container.serverId}
						>
							Günlükleri Görüntüle
						</ShowDockerModalLogs>
						<ShowContainerConfig
							containerId={container.containerId}
							serverId={container.serverId || ""}
						/>
						<DockerTerminalModal
							containerId={container.containerId}
							serverId={container.serverId || ""}
						>
							Terminal
						</DockerTerminalModal>

						<UploadFileModal
							containerId={container.containerId}
							serverId={container.serverId || undefined}
						>
							Dosya Yükle
						</UploadFileModal>
						<RemoveContainerDialog
							containerId={container.containerId}
							serverId={container.serverId ?? undefined}
						/>
					</DropdownMenuContent>
				</DropdownMenu>
			);
		},
	},
];
