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
import { ShowDockerModalStackLogs } from "../../docker/logs/show-docker-modal-stack-logs";

export interface ApplicationList {
	ID: string;
	Image: string;
	Mode: string;
	Name: string;
	Ports: string;
	Replicas: string;
	CurrentState: string;
	DesiredState: string;
	Error: string;
	Node: string;
	serverId: string;
}

export const columns: ColumnDef<ApplicationList>[] = [
	{
		accessorKey: "ID",
		accessorFn: (row) => row.ID,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					ID
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("ID")}</div>;
		},
	},
	{
		accessorKey: "Name",
		accessorFn: (row) => row.Name,
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
			return <div>{row.getValue("Name")}</div>;
		},
	},
	{
		accessorKey: "Image",
		accessorFn: (row) => row.Image,
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
		cell: ({ row }) => {
			return <div>{row.getValue("Image")}</div>;
		},
	},
	{
		accessorKey: "Mode",
		accessorFn: (row) => row.Mode,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Mod
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("Mode")}</div>;
		},
	},
	{
		accessorKey: "CurrentState",
		accessorFn: (row) => row.CurrentState,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Mevcut Durum
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const value = row.getValue("CurrentState") as string;
			const valueStart = value.startsWith("Running")
				? "Running"
				: value.startsWith("Shutdown")
					? "Shutdown"
					: value;
			return (
				<div className="capitalize">
					<Badge
						variant={
							valueStart === "Running"
								? "default"
								: value === "Shutdown"
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
		accessorKey: "DesiredState",
		accessorFn: (row) => row.DesiredState,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					İstenen Durum
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("DesiredState")}</div>;
		},
	},

	{
		accessorKey: "Replicas",
		accessorFn: (row) => row.Replicas,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Replikalar
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("Replicas")}</div>;
		},
	},

	{
		accessorKey: "Ports",
		accessorFn: (row) => row.Ports,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Portlar
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div>{row.getValue("Ports")}</div>;
		},
	},
	{
		accessorKey: "Errors",
		accessorFn: (row) => row.Error,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
				>
					Hatalar
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return <div className="w-[10rem]">{row.getValue("Errors")}</div>;
		},
	},
	{
		accessorKey: "Logs",
		accessorFn: (row) => row.Error,
		header: () => {
			return <span>Günlükler</span>;
		},
		cell: ({ row }) => {
			return (
				<span className="w-[10rem]">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" className="h-8 w-8 p-0">
								<span className="sr-only">Menüyü aç</span>
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>İşlemler</DropdownMenuLabel>
							<ShowDockerModalStackLogs
								containerId={row.original.ID}
								serverId={row.original.serverId}
							>
								Günlükleri Görüntüle
							</ShowDockerModalStackLogs>
						</DropdownMenuContent>
					</DropdownMenu>
				</span>
			);
		},
	},
];
