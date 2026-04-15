import copy from "copy-to-clipboard";
import { CopyIcon, ExternalLinkIcon, ServerIcon, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AlertBlock } from "@/components/shared/alert-block";
import { CodeEditor } from "@/components/shared/code-editor";
import { DialogAction } from "@/components/shared/dialog-action";
import { DrawerLogs } from "@/components/shared/drawer-logs";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { ShowDeployment } from "../../application/deployments/show-deployment";
import { type LogLine, parseLogs } from "../../docker/logs/utils";
import { EditScript } from "./edit-script";
import { GPUSupport } from "./gpu-support";
import { SecurityAudit } from "./security-audit";
import { SetupMonitoring } from "./setup-monitoring";
import { ValidateServer } from "./validate-server";

interface Props {
	serverId: string;
	asButton?: boolean;
}

export const SetupServer = ({ serverId, asButton = false }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const { data: server } = api.server.one.useQuery(
		{
			serverId,
		},
		{
			enabled: !!serverId,
		},
	);

	const [activeLog, setActiveLog] = useState<string | null>(null);
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const isBuildServer = server?.serverType === "build";
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [filteredLogs, setFilteredLogs] = useState<LogLine[]>([]);
	const [isDeploying, setIsDeploying] = useState(false);
	api.server.setupWithLogs.useSubscription(
		{
			serverId: serverId,
		},
		{
			enabled: isDeploying,
			onData(log) {
				if (!isDrawerOpen) {
					setIsDrawerOpen(true);
				}

				if (log === "Deployment completed successfully!") {
					setIsDeploying(false);
				}
				const parsedLogs = parseLogs(log);
				setFilteredLogs((prev) => [...prev, ...parsedLogs]);
			},
			onError(error) {
				console.error("Deployment logs error:", error);
				setIsDeploying(false);
			},
		},
	);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{asButton ? (
				<DialogTrigger asChild>
					<Button variant="outline" size="icon" className="h-9 w-9">
						<Settings className="h-4 w-4" />
					</Button>
				</DialogTrigger>
			) : (
				<Button
					className="w-full cursor-pointer "
					size="sm"
					onClick={() => {
						setIsOpen(true);
					}}
				>
					Sunucu Kurulumu <Settings className="size-4" />
				</Button>
			)}
			<DialogContent className="sm:max-w-4xl  ">
				<DialogHeader>
					<div className="flex flex-col gap-1.5">
						<DialogTitle className="flex items-center gap-2">
							<ServerIcon className="size-5" /> Sunucu Kurulumu
						</DialogTitle>
						<p className="text-muted-foreground text-sm">
							Bir sunucu kurmak için lütfen aşağıdaki düğmeye tıklayın.
						</p>
					</div>
				</DialogHeader>
				{!server?.sshKeyId ? (
					<div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3">
						<AlertBlock type="warning">
							Sunucuyu kurmadan önce lütfen sunucunuza bir SSH Anahtarı ekleyin.
							Sunucu Düzenle bölümünden sunucunuza bir SSH Anahtarı atayabilirsiniz.
						</AlertBlock>
					</div>
				) : (
					<div id="hook-form-add-gitlab" className="grid w-full gap-4">
						<AlertBlock type="info">
							Root olarak veya parolasız sudo erişimine sahip root olmayan bir
							kullanıcı olarak bağlanabilirsiniz. Root olmayan bir kullanıcı kullanıyorsanız,
							parolasız sudo yapılandırıldığından emin olun.
						</AlertBlock>

						<Tabs defaultValue="ssh-keys">
							<TabsList
								className={cn(
									"grid  w-[700px]",
									isBuildServer
										? "grid-cols-3"
										: isCloud
											? "grid-cols-6"
											: "grid-cols-5",
								)}
							>
								<TabsTrigger value="ssh-keys">SSH Anahtarları</TabsTrigger>
								<TabsTrigger value="deployments">Dağıtımlar</TabsTrigger>
								<TabsTrigger value="validate">Doğrulama</TabsTrigger>

								{!isBuildServer && (
									<>
										<TabsTrigger value="audit">Güvenlik</TabsTrigger>
										{isCloud && (
											<TabsTrigger value="monitoring">İzleme</TabsTrigger>
										)}
										<TabsTrigger value="gpu-setup">GPU Kurulumu</TabsTrigger>
									</>
								)}
							</TabsList>
							<TabsContent
								value="ssh-keys"
								className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
							>
								<div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3">
									<p className="text-primary text-base font-semibold">
										Sunucunuza SSH Anahtarları eklemek için iki seçeneğiniz var:
									</p>

									<ul>
										<li>
											1. Tercih ettiğiniz sağlayıcıda (Hostinger, Digital Ocean, Hetzner,
											vb.) sunucu oluştururken genel SSH Anahtarını ekleyin{" "}
										</li>
										<li>2. SSH Anahtarını Sunucuya Manuel Olarak Ekleyin</li>
									</ul>
									<div className="flex flex-col gap-4 w-full overflow-auto">
										<div className="flex relative flex-col gap-2 overflow-y-auto">
											<div className="text-sm text-primary flex flex-row gap-2 items-center">
												Genel Anahtarı Kopyala ({server?.sshKey?.name})
												<button
													type="button"
													className="right-2 top-8"
													onClick={() => {
														copy(
															server?.sshKey?.publicKey || "Bir SSH Anahtarı Oluşturun",
														);
														toast.success("SSH panoya kopyalandı");
													}}
												>
													<CopyIcon className="size-4 text-muted-foreground" />
												</button>
											</div>
										</div>
									</div>

									<div className="flex flex-col gap-2 w-full mt-2 border rounded-lg p-4">
										<span className="text-base font-semibold text-primary">
											Otomatik süreç
										</span>
										<Link
											href="https://docs.dokploy.com/docs/core/remote-servers/instructions#requirements"
											target="_blank"
											className="text-primary flex flex-row gap-2"
										>
											Öğreticiyi Görüntüle <ExternalLinkIcon className="size-4" />
										</Link>
									</div>
									<div className="flex flex-col gap-2 w-full border rounded-lg p-4">
										<span className="text-base font-semibold text-primary">
											Manuel süreç
										</span>
										<ul>
											<li className="items-center flex gap-1">
												1. Sunucunuza giriş yapın{" "}
												<span className="text-primary bg-secondary p-1 rounded-lg">
													ssh {server?.username}@{server?.ipAddress}
												</span>
												<button
													type="button"
													onClick={() => {
														copy(
															`ssh ${server?.username}@${server?.ipAddress}`,
														);
														toast.success("Panoya kopyalandı");
													}}
												>
													<CopyIcon className="size-4" />
												</button>
											</li>
											<li>
												2. Giriş yaptıktan sonra aşağıdaki komutu çalıştırın
												<div className="flex  relative flex-col gap-4 w-full mt-2">
													<CodeEditor
														lineWrapping
														language="properties"
														value={`echo "${server?.sshKey?.publicKey}" >> ~/.ssh/authorized_keys`}
														readOnly
														className="font-mono opacity-60"
													/>
													<button
														type="button"
														className="absolute right-2 top-2"
														onClick={() => {
															copy(
																`echo "${server?.sshKey?.publicKey}" >> ~/.ssh/authorized_keys`,
															);
															toast.success("Panoya kopyalandı");
														}}
													>
														<CopyIcon className="size-4" />
													</button>
												</div>
											</li>
											<li className="mt-1">
												3. İşlem tamamlandı, terminal sekmesine girerek veya sunucu
												kurulum sekmesini kullanarak bağlantıyı test edebilirsiniz.
											</li>
										</ul>
									</div>
									<div className="flex flex-col gap-2 w-full border rounded-lg p-4">
										<span className="text-base font-semibold text-primary">
											Desteklenen Dağıtımlar:
										</span>
										<p>
											En iyi deneyimi sağlamak için aşağıdaki dağıtımları
											kullanmanızı şiddetle öneriyoruz:
										</p>
										<ul>
											<li>1. Ubuntu 24.04 LTS</li>
											<li>2. Ubuntu 23.10 LTS </li>
											<li>3. Ubuntu 22.04 LTS</li>
											<li>4. Ubuntu 20.04 LTS</li>
											<li>5. Ubuntu 18.04 LTS</li>
											<li>6. Debian 12</li>
											<li>7. Debian 11</li>
											<li>8. Debian 10</li>
											<li>9. Fedora 40</li>
											<li>10. Centos 9</li>
											<li>11. Centos 8</li>
										</ul>
									</div>
								</div>
							</TabsContent>
							<TabsContent value="deployments">
								<CardContent className="p-0">
									<div className="flex flex-col gap-4">
										<Card className="bg-background">
											<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
												<div className="flex flex-row gap-2 justify-between w-full max-sm:flex-col">
													<div className="flex flex-col gap-1">
														<CardTitle className="text-xl">
															Sunucu Kurulumu
														</CardTitle>
														<CardDescription>
															Bir sunucu kurmak için lütfen aşağıdaki düğmeye
															tıklayın.
														</CardDescription>
													</div>
												</div>
											</CardHeader>
											<CardContent className="flex flex-col gap-4 min-h-[25vh] items-center">
												<div className="flex flex-col gap-4 items-center h-full max-w-xl mx-auto min-h-[25vh] justify-center">
													<span className="text-sm text-muted-foreground text-center">
														Sunucunuz hazır olduğunda, sunucu kurulumu için
														kullandığımız betiği doğrudan çalıştırmak veya betiği
														doğrudan düzenlemek için aşağıdaki düğmeye tıklayabilirsiniz
													</span>
													<div className="flex flex-row gap-2">
														<EditScript serverId={server?.serverId || ""} />
														<DialogAction
															title={"Sunucu Kurulsun mu?"}
															type="default"
															description="Bu işlem sunucuyu ve ilişkili tüm verileri kuracaktır"
															onClick={async () => {
																setIsDeploying(true);
															}}
														>
															<Button>Sunucuyu Kur</Button>
														</DialogAction>
													</div>
												</div>

												<ShowDeployment
													open={activeLog !== null}
													onClose={() => setActiveLog(null)}
													logPath={activeLog}
												/>
											</CardContent>
										</Card>
									</div>
								</CardContent>
							</TabsContent>
							<TabsContent
								value="validate"
								className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
							>
								<div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3">
									<ValidateServer serverId={serverId} />
								</div>
							</TabsContent>
							{!isBuildServer && (
								<>
									<TabsContent
										value="audit"
										className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
									>
										<div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3">
											<SecurityAudit serverId={serverId} />
										</div>
									</TabsContent>
									<TabsContent
										value="monitoring"
										className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
									>
										<div className="flex flex-col gap-2 text-sm pt-3">
											<div className="rounded-xl bg-background shadow-md border">
												<SetupMonitoring serverId={serverId} />
											</div>
										</div>
									</TabsContent>
									<TabsContent
										value="gpu-setup"
										className="outline-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
									>
										<div className="flex flex-col gap-2 text-sm text-muted-foreground pt-3">
											<GPUSupport serverId={serverId} />
										</div>
									</TabsContent>
								</>
							)}
						</Tabs>
					</div>
				)}
			</DialogContent>
			<DrawerLogs
				isOpen={isDrawerOpen}
				onClose={() => {
					setIsDrawerOpen(false);
					setFilteredLogs([]);
					setIsDeploying(false);
				}}
				filteredLogs={filteredLogs}
			/>
		</Dialog>
	);
};
