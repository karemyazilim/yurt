import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { HelpCircle, KeyRoundIcon, LockIcon, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GitIcon } from "@/components/icons/data-tools-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";

const GitProviderSchema = z.object({
	buildPath: z.string().min(1, "Yol zorunludur").default("/"),
	repositoryURL: z.string().min(1, {
		message: "Depo URL'si zorunludur",
	}),
	branch: z.string().min(1, "Dal zorunludur"),
	sshKey: z.string().optional(),
	watchPaths: z.array(z.string()).optional(),
	enableSubmodules: z.boolean().default(false),
});

type GitProvider = z.infer<typeof GitProviderSchema>;

interface Props {
	applicationId: string;
}

export const SaveGitProvider = ({ applicationId }: Props) => {
	const { data, refetch } = api.application.one.useQuery({ applicationId });
	const { data: sshKeys } = api.sshKey.allForApps.useQuery();
	const router = useRouter();

	const { mutateAsync, isPending } =
		api.application.saveGitProvider.useMutation();

	const form = useForm({
		defaultValues: {
			branch: "",
			buildPath: "/",
			repositoryURL: "",
			sshKey: undefined,
			watchPaths: [],
			enableSubmodules: false,
		},
		resolver: zodResolver(GitProviderSchema),
	});

	useEffect(() => {
		if (data) {
			form.reset({
				sshKey: data.customGitSSHKeyId || undefined,
				branch: data.customGitBranch || "",
				buildPath: data.customGitBuildPath || "/",
				repositoryURL: data.customGitUrl || "",
				watchPaths: data.watchPaths || [],
				enableSubmodules: data.enableSubmodules ?? false,
			});
		}
	}, [form.reset, data, form]);

	const onSubmit = async (values: GitProvider) => {
		await mutateAsync({
			customGitBranch: values.branch,
			customGitBuildPath: values.buildPath,
			customGitUrl: values.repositoryURL,
			customGitSSHKeyId: values.sshKey === "none" ? null : values.sshKey,
			applicationId,
			watchPaths: values.watchPaths || [],
			enableSubmodules: values.enableSubmodules,
		})
			.then(async () => {
				toast.success("Git Sağlayıcı Kaydedildi");
				await refetch();
			})
			.catch(() => {
				toast.error("Git sağlayıcı kaydedilirken hata oluştu");
			});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-col gap-4"
			>
				<div className="grid md:grid-cols-2 gap-4">
					<div className="flex items-end col-span-2 gap-4">
						<div className="grow">
							<FormField
								control={form.control}
								name="repositoryURL"
								render={({ field }) => (
									<FormItem>
										<div className="flex items-center justify-between">
											<FormLabel>Depo URL'si</FormLabel>
											{field.value?.startsWith("https://") && (
												<Link
													href={field.value}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
												>
													<GitIcon className="h-4 w-4" />
													<span>Depoyu Görüntüle</span>
												</Link>
											)}
										</div>
										<FormControl>
											<Input placeholder="Depo URL'si" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						{sshKeys && sshKeys.length > 0 ? (
							<FormField
								control={form.control}
								name="sshKey"
								render={({ field }) => (
									<FormItem className="basis-40">
										<FormLabel className="w-full inline-flex justify-between">
											SSH Anahtarı
											<LockIcon className="size-4 text-muted-foreground" />
										</FormLabel>
										<FormControl>
											<Select
												key={field.value}
												onValueChange={field.onChange}
												defaultValue={field.value}
												value={field.value}
											>
												<SelectTrigger>
													<SelectValue placeholder="Bir anahtar seçin" />
												</SelectTrigger>
												<SelectContent>
													<SelectGroup>
														{sshKeys?.map((sshKey) => (
															<SelectItem
																key={sshKey.sshKeyId}
																value={sshKey.sshKeyId}
															>
																{sshKey.name}
															</SelectItem>
														))}
														<SelectItem value="none">Yok</SelectItem>
														<SelectLabel>Anahtarlar ({sshKeys?.length})</SelectLabel>
													</SelectGroup>
												</SelectContent>
											</Select>
										</FormControl>
									</FormItem>
								)}
							/>
						) : (
							<Button
								variant="secondary"
								onClick={() => router.push("/dashboard/settings/ssh-keys")}
								type="button"
							>
								<KeyRoundIcon className="size-4" /> SSH Anahtarı Ekle
							</Button>
						)}
					</div>
					<div className="space-y-4">
						<FormField
							control={form.control}
							name="branch"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Dal</FormLabel>
									<FormControl>
										<Input placeholder="Dal" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="buildPath"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Derleme Yolu</FormLabel>
								<FormControl>
									<Input placeholder="/" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="watchPaths"
						render={({ field }) => (
							<FormItem className="md:col-span-2">
								<div className="flex items-center gap-2">
									<FormLabel>İzleme Yolları</FormLabel>
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<HelpCircle className="size-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
											</TooltipTrigger>
											<TooltipContent className="max-w-[300px]">
												<p>
													Değişiklikleri izlemek için yollar ekleyin. Bu yollardaki
													dosyalar değiştiğinde yeni bir dağıtım tetiklenir. Bu
													yalnızca manuel webhook kurulduğunda çalışır.
												</p>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								</div>
								<div className="flex flex-wrap gap-2 mb-2">
									{field.value?.map((path, index) => (
										<Badge key={index} variant="secondary">
											{path}
											<X
												className="ml-1 size-3 cursor-pointer"
												onClick={() => {
													const newPaths = [...(field.value || [])];
													newPaths.splice(index, 1);
													form.setValue("watchPaths", newPaths);
												}}
											/>
										</Badge>
									))}
								</div>
								<FormControl>
									<div className="flex gap-2">
										<Input
											placeholder="İzlenecek bir yol girin (örn. src/**, dist/*.js)"
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													const input = e.currentTarget;
													const value = input.value.trim();
													if (value) {
														const newPaths = [...(field.value || []), value];
														form.setValue("watchPaths", newPaths);
														input.value = "";
													}
												}
											}}
										/>
										<Button
											type="button"
											variant="secondary"
											onClick={() => {
												const input = document.querySelector(
													'input[placeholder="İzlenecek bir yol girin (örn. src/**, dist/*.js)"]',
												) as HTMLInputElement;
												const value = input.value.trim();
												if (value) {
													const newPaths = [...(field.value || []), value];
													form.setValue("watchPaths", newPaths);
													input.value = "";
												}
											}}
										>
											Ekle
										</Button>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="enableSubmodules"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-2">
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="!mt-0">Alt Modülleri Etkinleştir</FormLabel>
							</FormItem>
						)}
					/>
				</div>

				<div className="flex flex-row justify-end">
					<Button type="submit" className="w-fit" isLoading={isPending}>
						Kaydet
					</Button>
				</div>
			</form>
		</Form>
	);
};
