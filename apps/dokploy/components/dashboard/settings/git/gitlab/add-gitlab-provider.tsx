import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GitlabIcon } from "@/components/icons/data-tools-icons";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";
import { useUrl } from "@/utils/hooks/use-url";

const Schema = z.object({
	name: z.string().min(1, {
		message: "Name is required",
	}),
	gitlabUrl: z.string().min(1, {
		message: "GitLab URL is required",
	}),
	gitlabInternalUrl: z
		.union([z.string().url(), z.literal("")])
		.optional()
		.transform((v) => (v === "" ? undefined : v)),
	applicationId: z.string().min(1, {
		message: "Application ID is required",
	}),
	applicationSecret: z.string().min(1, {
		message: "Application Secret is required",
	}),

	redirectUri: z.string().min(1, {
		message: "Redirect URI is required",
	}),
	groupName: z.string().optional(),
});

type Schema = z.infer<typeof Schema>;

export const AddGitlabProvider = () => {
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const url = useUrl();
	const { data: auth } = api.user.get.useQuery();
	const { mutateAsync, error, isError } = api.gitlab.create.useMutation();
	const webhookUrl = `${url}/api/providers/gitlab/callback`;

	const form = useForm({
		defaultValues: {
			applicationId: "",
			applicationSecret: "",
			groupName: "",
			redirectUri: webhookUrl,
			name: "",
			gitlabUrl: "https://gitlab.com",
			gitlabInternalUrl: "",
		},
		resolver: zodResolver(Schema),
	});

	const gitlabUrl = form.watch("gitlabUrl");

	useEffect(() => {
		form.reset({
			applicationId: "",
			applicationSecret: "",
			groupName: "",
			redirectUri: webhookUrl,
			name: "",
			gitlabUrl: "https://gitlab.com",
			gitlabInternalUrl: "",
		});
	}, [form, isOpen]);

	const onSubmit = async (data: Schema) => {
		await mutateAsync({
			applicationId: data.applicationId || "",
			secret: data.applicationSecret || "",
			groupName: data.groupName || "",
			authId: auth?.id || "",
			name: data.name || "",
			redirectUri: data.redirectUri || "",
			gitlabUrl: data.gitlabUrl || "https://gitlab.com",
			gitlabInternalUrl: data.gitlabInternalUrl || undefined,
		})
			.then(async () => {
				await utils.gitProvider.getAll.invalidate();
				toast.success("GitLab başarıyla oluşturuldu");
				setIsOpen(false);
			})
			.catch(() => {
				toast.error("GitLab yapılandırılırken hata oluştu");
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="default"
					className="flex items-center space-x-1 bg-purple-700 text-white hover:bg-purple-600"
				>
					<GitlabIcon />
					<span>GitLab</span>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl  ">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						GitLab Sağlayıcısı <GitlabIcon className="size-5" />
					</DialogTitle>
				</DialogHeader>

				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						id="hook-form-add-gitlab"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-1"
					>
						<CardContent className="p-0">
							<div className="flex flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									GitLab hesabınızı entegre etmek için GitLab ayarlarınızda yeni
									bir uygulama oluşturmanız gerekir. Şu adımları izleyin:
								</p>
								<ol className="list-decimal list-inside text-sm text-muted-foreground">
									<li className="flex flex-row gap-2 items-center">
										GitLab profil ayarlarınıza gidin{" "}
										<Link
											href={`${gitlabUrl}/-/profile/applications`}
											target="_blank"
										>
											<ExternalLink className="w-fit text-primary size-4" />
										</Link>
									</li>
									<li>Uygulamalar bölümüne gidin</li>
									<li>
										Aşağıdaki bilgilerle yeni bir uygulama oluşturun:
										<ul className="list-disc list-inside ml-4">
											<li>Name: Dokploy</li>
											<li>
												Redirect URI:{" "}
												<span className="text-primary">{webhookUrl}</span>{" "}
											</li>
											<li>Scopes: api, read_user, read_repository</li>
										</ul>
									</li>
									<li>
										Oluşturduktan sonra bir Uygulama Kimliği ve Gizli Anahtar
										alacaksınız, bunları kopyalayıp aşağıya yapıştırın.
									</li>
								</ol>
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Ad</FormLabel>
											<FormControl>
												<Input
													placeholder="Random Name eg(my-personal-account)"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="gitlabUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Gitlab URL</FormLabel>
											<FormControl>
												<Input placeholder="https://gitlab.com/" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="gitlabInternalUrl"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Dahili URL (İsteğe Bağlı)</FormLabel>
											<FormControl>
												<Input
													placeholder="http://gitlab:80"
													{...field}
													value={field.value ?? ""}
												/>
											</FormControl>
											<FormDescription>
												GitLab, Dokploy ile aynı sunucuda çalıştığında kullanın.
												OAuth token değişimi için dahili ağ üzerinden GitLab'a
												ulaşmak için kullanılır (ör. Docker servis adı).
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="redirectUri"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Yönlendirme URI'si</FormLabel>
											<FormControl>
												<Input
													disabled
													placeholder="Random Name eg(my-personal-account)"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="applicationId"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Uygulama Kimliği</FormLabel>
											<FormControl>
												<Input placeholder="Application ID" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="applicationSecret"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Uygulama Gizli Anahtarı</FormLabel>
											<FormControl>
												<Input
													type="password"
													placeholder="Application Secret"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="groupName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>
												Grup Adı (İsteğe Bağlı, Virgülle Ayrılmış Liste)
											</FormLabel>
											<FormControl>
												<Input
													placeholder="For organization/group access use the slug name of the group eg: my-org"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<Button isLoading={form.formState.isSubmitting}>
									GitLab Uygulamasını Yapılandır
								</Button>
							</div>
						</CardContent>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
