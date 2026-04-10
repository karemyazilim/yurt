import { GitBranch, Loader2, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { SaveDockerSağlayıcı } from "@/components/dashboard/application/general/generic/save-docker-provider";
import { SaveGitSağlayıcı } from "@/components/dashboard/application/general/generic/save-git-provider";
import { SaveGiteaSağlayıcı } from "@/components/dashboard/application/general/generic/save-gitea-provider";
import { SaveGithubSağlayıcı } from "@/components/dashboard/application/general/generic/save-github-provider";
import {
	BitbucketIcon,
	DockerIcon,
	GiteaIcon,
	GithubIcon,
	GitIcon,
	GitlabIcon,
} from "@/components/icons/data-tools-icons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/utils/api";
import { SaveBitbucketSağlayıcı } from "./save-bitbucket-provider";
import { SaveDragNDrop } from "./save-drag-n-drop";
import { SaveGitlabSağlayıcı } from "./save-gitlab-provider";
import { UnauthorizedGitSağlayıcı } from "./unauthorized-git-provider";

type TabState =
	| "github"
	| "docker"
	| "git"
	| "drop"
	| "gitlab"
	| "bitbucket"
	| "gitea";

interface Props {
	applicationId: string;
}

export const ShowSağlayıcıForm = ({ applicationId }: Props) => {
	const { data: githubSağlayıcıs, isPending: isLoadingGithub } =
		api.github.githubSağlayıcıs.useQuery();
	const { data: gitlabSağlayıcıs, isPending: isLoadingGitlab } =
		api.gitlab.gitlabSağlayıcıs.useQuery();
	const { data: bitbucketSağlayıcıs, isPending: isLoadingBitbucket } =
		api.bitbucket.bitbucketSağlayıcıs.useQuery();
	const { data: giteaSağlayıcıs, isPending: isLoadingGitea } =
		api.gitea.giteaSağlayıcıs.useQuery();

	const { data: application, refetch } = api.application.one.useQuery({
		applicationId,
	});
	const { mutateAsync: disconnectGitSağlayıcı } =
		api.application.disconnectGitSağlayıcı.useMutation();

	const [tab, setSab] = useState<TabState>(application?.sourceType || "github");

	const isLoading =
		isLoadingGithub || isLoadingGitlab || isLoadingBitbucket || isLoadingGitea;

	const handleDisconnect = async () => {
		try {
			await disconnectGitSağlayıcı({ applicationId });
			toast.success("Depo bağlantısı başarıyla kesildi");
			await refetch();
		} catch (error) {
			toast.error(
				`Depo bağlantısı kesilirken hata oluştu: ${
					error instanceof Error ? error.message : "Bilinmeyen hata"
				}`,
			);
		}
	};

	if (isLoading) {
		return (
			<Card className="group relative w-full bg-transparent">
				<CardHeader>
					<CardTitle className="flex items-start justify-between">
						<div className="flex flex-col gap-2">
							<span className="flex flex-col space-y-0.5">Sağlayıcı</span>
							<p className="flex items-center text-sm font-normal text-muted-foreground">
								Kodunuzun kaynağını seçin
							</p>
						</div>
						<div className="hidden space-y-1 text-sm font-normal md:block">
							<GitBranch className="size-6 text-muted-foreground" />
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex min-h-[25vh] items-center justify-center">
						<div className="flex items-center gap-2 text-muted-foreground">
							<Loader2 className="size-4 animate-spin" />
							<span>Sağlayıcılar yükleniyor...</span>
						</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	// Check if user doesn't have access to the current git provider
	if (
		application &&
		!application.hasGitSağlayıcıAccess &&
		application.sourceType !== "docker" &&
		application.sourceType !== "drop"
	) {
		return (
			<Card className="group relative w-full bg-transparent">
				<CardHeader>
					<CardTitle className="flex items-start justify-between">
						<div className="flex flex-col gap-2">
							<span className="flex flex-col space-y-0.5">Sağlayıcı</span>
							<p className="flex items-center text-sm font-normal text-muted-foreground">
								Yetkisiz sağlayıcı üzerinden depo bağlantısı
							</p>
						</div>
						<div className="hidden space-y-1 text-sm font-normal md:block">
							<GitBranch className="size-6 text-muted-foreground" />
						</div>
					</CardTitle>
				</CardHeader>
				<CardContent>
					<UnauthorizedGitSağlayıcı
						service={application}
						onDisconnect={handleDisconnect}
					/>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="group relative w-full bg-transparent">
			<CardHeader>
				<CardTitle className="flex items-start justify-between">
					<div className="flex flex-col gap-2">
						<span className="flex flex-col space-y-0.5">Sağlayıcı</span>
						<p className="flex items-center text-sm font-normal text-muted-foreground">
							Kodunuzun kaynağını seçin
						</p>
					</div>
					<div className="hidden space-y-1 text-sm font-normal md:block">
						<GitBranch className="size-6 text-muted-foreground" />
					</div>
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Tabs
					value={tab}
					className="w-full"
					onValueChange={(e) => {
						setSab(e as TabState);
					}}
				>
					<div className="flex flex-row items-center justify-between w-full overflow-auto">
						<TabsList className="flex gap-4 justify-start bg-transparent">
							<TabsTrigger
								value="github"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<GithubIcon className="size-4 text-current fill-current" />
								Github
							</TabsTrigger>
							<TabsTrigger
								value="gitlab"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<GitlabIcon className="size-4 text-current fill-current" />
								Gitlab
							</TabsTrigger>
							<TabsTrigger
								value="bitbucket"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<BitbucketIcon className="size-4 text-current fill-current" />
								Bitbucket
							</TabsTrigger>
							<TabsTrigger
								value="gitea"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<GiteaIcon className="size-4 text-current fill-current" />
								Gitea
							</TabsTrigger>
							<TabsTrigger
								value="docker"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<DockerIcon className="size-5 text-current" />
								Docker
							</TabsTrigger>
							<TabsTrigger
								value="git"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<GitIcon />
								Git
							</TabsTrigger>
							<TabsTrigger
								value="drop"
								className="rounded-none border-b-2 gap-2 border-b-transparent data-[state=active]:border-b-2 data-[state=active]:border-b-border"
							>
								<UploadCloud className="size-5 text-current" />
								Drop
							</TabsTrigger>
						</TabsList>
					</div>

					<TabsContent value="github" className="w-full p-2">
						{githubSağlayıcıs && githubSağlayıcıs?.length > 0 ? (
							<SaveGithubSağlayıcı applicationId={applicationId} />
						) : (
							<div className="flex flex-col items-center gap-3 min-h-[25vh] justify-center">
								<GithubIcon className="size-8 text-muted-foreground" />
								<span className="text-base text-muted-foreground">
									GitHub kullanarak dağıtım yapmak için önce hesabınızı
									yapılandırmanız gerekiyor. Lütfen{" "}
									<Link
										href="/dashboard/settings/git-providers"
										className="text-foreground"
									>
										Ayarlar
									</Link>{" "}
									bölümüne gidin.
								</span>
							</div>
						)}
					</TabsContent>
					<TabsContent value="gitlab" className="w-full p-2">
						{gitlabSağlayıcıs && gitlabSağlayıcıs?.length > 0 ? (
							<SaveGitlabSağlayıcı applicationId={applicationId} />
						) : (
							<div className="flex flex-col items-center gap-3 min-h-[25vh] justify-center">
								<GitlabIcon className="size-8 text-muted-foreground" />
								<span className="text-base text-muted-foreground">
									GitLab kullanarak dağıtım yapmak için önce hesabınızı
									yapılandırmanız gerekiyor. Lütfen{" "}
									<Link
										href="/dashboard/settings/git-providers"
										className="text-foreground"
									>
										Ayarlar
									</Link>{" "}
									bölümüne gidin.
								</span>
							</div>
						)}
					</TabsContent>
					<TabsContent value="bitbucket" className="w-full p-2">
						{bitbucketSağlayıcıs && bitbucketSağlayıcıs?.length > 0 ? (
							<SaveBitbucketSağlayıcı applicationId={applicationId} />
						) : (
							<div className="flex flex-col items-center gap-3 min-h-[25vh] justify-center">
								<BitbucketIcon className="size-8 text-muted-foreground" />
								<span className="text-base text-muted-foreground">
									Bitbucket kullanarak dağıtım yapmak için önce hesabınızı
									yapılandırmanız gerekiyor. Lütfen{" "}
									<Link
										href="/dashboard/settings/git-providers"
										className="text-foreground"
									>
										Ayarlar
									</Link>{" "}
									bölümüne gidin.
								</span>
							</div>
						)}
					</TabsContent>
					<TabsContent value="gitea" className="w-full p-2">
						{giteaSağlayıcıs && giteaSağlayıcıs?.length > 0 ? (
							<SaveGiteaSağlayıcı applicationId={applicationId} />
						) : (
							<div className="flex flex-col items-center gap-3 min-h-[25vh] justify-center">
								<GiteaIcon className="size-8 text-muted-foreground" />
								<span className="text-base text-muted-foreground">
									Gitea kullanarak dağıtım yapmak için önce hesabınızı
									yapılandırmanız gerekiyor. Lütfen{" "}
									<Link
										href="/dashboard/settings/git-providers"
										className="text-foreground"
									>
										Ayarlar
									</Link>{" "}
									bölümüne gidin.
								</span>
							</div>
						)}
					</TabsContent>
					<TabsContent value="docker" className="w-full p-2">
						<SaveDockerSağlayıcı applicationId={applicationId} />
					</TabsContent>

					<TabsContent value="git" className="w-full p-2">
						<SaveGitSağlayıcı applicationId={applicationId} />
					</TabsContent>
					<TabsContent value="drop" className="w-full p-2">
						<SaveDragNDrop applicationId={applicationId} />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
};
