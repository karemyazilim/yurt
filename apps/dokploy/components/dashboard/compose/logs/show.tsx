import { Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { badgeStateColor } from "@/components/dashboard/application/logs/show";
import { Badge } from "@/components/ui/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";
export const DockerLogs = dynamic(
	() =>
		import("@/components/dashboard/docker/logs/docker-logs-id").then(
			(e) => e.DockerLogsId,
		),
	{
		ssr: false,
	},
);

interface Props {
	appName: string;
	serverId?: string;
	appType: "stack" | "docker-compose";
}

export const ShowDockerLogsCompose = ({
	appName,
	appType,
	serverId,
}: Props) => {
	const { data, isPending } = api.docker.getContainersByAppNameMatch.useQuery(
		{
			appName,
			appType,
			serverId,
		},
		{
			enabled: !!appName,
		},
	);
	const [containerId, setContainerId] = useState<string | undefined>();

	useEffect(() => {
		if (data && data?.length > 0) {
			setContainerId(data[0]?.containerId);
		}
	}, [data]);

	return (
		<Card className="bg-background">
			<CardHeader>
				<CardTitle className="text-xl">Günlükler</CardTitle>
				<CardDescription>
					Uygulamanın günlüklerini gerçek zamanlı izleyin
				</CardDescription>
			</CardHeader>

			<CardContent className="flex flex-col gap-4">
				<Label>Günlükleri görüntülemek için bir konteyner seçin</Label>
				<Select onValueChange={setContainerId} value={containerId}>
					<SelectTrigger>
						{isPending ? (
							<div className="flex flex-row gap-2 items-center justify-center text-sm text-muted-foreground">
								<span>Yükleniyor...</span>
								<Loader2 className="animate-spin size-4" />
							</div>
						) : (
							<SelectValue placeholder="Bir konteyner seçin" />
						)}
					</SelectTrigger>
					<SelectContent>
						<SelectGroup>
							{data?.map((container) => (
								<SelectItem
									key={container.containerId}
									value={container.containerId}
								>
									{container.name} ({container.containerId}){" "}
									<Badge variant={badgeStateColor(container.state)}>
										{container.state}
									</Badge>
									{container.status ? ` ${container.status}` : ""}
								</SelectItem>
							))}
							<SelectLabel>Konteynerler ({data?.length})</SelectLabel>
						</SelectGroup>
					</SelectContent>
				</Select>
				<DockerLogs
					serverId={serverId || ""}
					containerId={containerId || "select-a-container"}
					runType="native"
				/>
			</CardContent>
		</Card>
	);
};
