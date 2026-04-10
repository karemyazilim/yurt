import { format } from "date-fns";
import { useEffect, useState } from "react";
import { GithubIcon } from "@/components/icons/data-tools-icons";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { api } from "@/utils/api";

export const AddGithubProvider = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { data: activeOrganization } = api.organization.active.useQuery();

	const { data: session } = api.user.session.useQuery();
	const { data } = api.user.get.useQuery();
	const [manifest, setManifest] = useState("");
	const [isOrganization, setIsOrganization] = useState(false);
	const [organizationName, setOrganization] = useState("");

	const randomString = () => Math.random().toString(36).slice(2, 8);

	useEffect(() => {
		const url = document.location.origin;
		const manifest = JSON.stringify(
			{
				redirect_url: `${origin}/api/providers/github/setup?organizationId=${activeOrganization?.id ?? ""}&userId=${session?.user?.id ?? ""}`,
				name: `Dokploy-${format(new Date(), "yyyy-MM-dd")}-${randomString()}`,
				url: origin,
				hook_attributes: {
					url: `${url}/api/deploy/github`,
				},
				callback_urls: [`${origin}/api/providers/github/setup`],
				public: false,
				request_oauth_on_install: true,
				default_permissions: {
					contents: "read",
					metadata: "read",
					emails: "read",
					pull_requests: "write",
				},
				default_events: ["pull_request", "push"],
			},
			null,
			4,
		);

		setManifest(manifest);
	}, [activeOrganization?.id, session?.user?.id]);

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary" className="flex items-center space-x-1">
					<GithubIcon className="text-current fill-current" />
					<span>Github</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl ">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Github Sağlayıcısı <GithubIcon className="size-5" />
					</DialogTitle>
				</DialogHeader>

				<div id="hook-form-add-project" className="grid w-full gap-1">
					<CardContent className="p-0">
						<div className="flex flex-col ">
							<p className="text-muted-foreground text-sm">
								GitHub hesabınızı hizmetlerimizle entegre etmek için bir GitHub
								uygulaması oluşturmanız ve yüklemeniz gerekir. Bu işlem basittir
								ve yalnızca birkaç dakika sürer. Başlamak için aşağıdaki düğmeye
								tıklayın.
							</p>
							<div className="mt-4 flex flex-col gap-4">
								<div className="flex flex-row gap-4">
									<span>Kuruluş?</span>
									<Switch
										checked={isOrganization}
										onCheckedChange={(checked) => setIsOrganization(checked)}
									/>
								</div>

								{isOrganization && (
									<Input
										required
										placeholder="Kuruluş adı"
										onChange={(e) => setOrganization(e.target.value)}
									/>
								)}
							</div>
							<form
								action={
									isOrganization
										? `https://github.com/organizations/${organizationName}/settings/apps/new?state=gh_init:${activeOrganization?.id}:${session?.user?.id ?? ""}`
										: `https://github.com/settings/apps/new?state=gh_init:${activeOrganization?.id}:${session?.user?.id ?? ""}`
								}
								method="post"
							>
								<input
									type="text"
									name="manifest"
									id="manifest"
									defaultValue={manifest}
									className="invisible"
								/>
								<br />

								<div className="flex w-full items-center justify-between">
									<a
										href={
											isOrganization && organizationName
												? `https://github.com/organizations/${organizationName}/settings/installations`
												: "https://github.com/settings/installations"
										}
										className={`text-muted-foreground text-sm hover:underline duration-300
											 ${
													isOrganization && !organizationName
														? "pointer-events-none opacity-50"
														: ""
												}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										Zaten bir uygulamanız olup olmadığından emin değil misiniz?
									</a>
									<Button
										disabled={isOrganization && organizationName.length < 1}
										type="submit"
										className="self-end"
									>
										GitHub Uygulaması Oluştur
									</Button>
								</div>
							</form>
						</div>
					</CardContent>
				</div>
			</DialogContent>
		</Dialog>
	);
};
