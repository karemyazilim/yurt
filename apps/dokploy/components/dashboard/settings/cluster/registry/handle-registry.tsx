import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { AlertTriangle, PenBoxIcon, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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

const AddRegistrySchema = z.object({
	registryName: z.string().min(1, {
		message: "Kayıt defteri adı gereklidir",
	}),
	username: z.string().min(1, {
		message: "Kullanıcı adı gereklidir",
	}),
	password: z.string(),
	registryUrl: z
		.string()
		.optional()
		.refine(
			(val) => {
				// If empty or undefined, skip validation (field is optional)
				if (!val || val.trim().length === 0) {
					return true;
				}
				// Validate that it's a valid hostname (no protocol, no path, optional port)
				// Valid formats: example.com, registry.example.com, [::1], example.com:5000
				// Invalid: https://example.com, example.com/path
				const trimmed = val.trim();
				// Check for protocol or path - these are not allowed
				if (/^https?:\/\//i.test(trimmed) || trimmed.includes("/")) {
					return false;
				}
				// Basic hostname validation: allow alphanumeric, dots, hyphens, underscores, and IPv6 in brackets
				// Allow optional port at the end
				const hostnameRegex =
					/^(?:\[[^\]]+\]|[a-zA-Z0-9](?:[a-zA-Z0-9._-]{0,253}[a-zA-Z0-9])?)(?::\d+)?$/;
				return hostnameRegex.test(trimmed);
			},
			{
				message:
					"Geçersiz kayıt defteri URL'si. Lütfen yalnızca sunucu adını girin (ör. example.com veya registry.example.com). Protokol (https://) veya yol eklemeyin.",
			},
		),
	imagePrefix: z.string(),
	serverId: z.string().optional(),
	isEditing: z.boolean().optional(),
});

type AddRegistry = z.infer<typeof AddRegistrySchema>;

interface Props {
	registryId?: string;
}

export const HandleRegistry = ({ registryId }: Props) => {
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);

	const { data: registry } = api.registry.one.useQuery(
		{
			registryId: registryId || "",
		},
		{
			enabled: !!registryId,
		},
	);

	const { data: isCloud } = api.settings.isCloud.useQuery();

	const { mutateAsync, error, isError } = registryId
		? api.registry.update.useMutation()
		: api.registry.create.useMutation();
	const { data: deployServers } = api.server.withSSHKey.useQuery();
	const { data: buildServers } = api.server.buildServers.useQuery();
	const servers = [...(deployServers || []), ...(buildServers || [])];
	const {
		mutateAsync: testRegistry,
		isPending,
		error: testRegistryError,
		isError: testRegistryIsError,
	} = api.registry.testRegistry.useMutation();
	const {
		mutateAsync: testRegistryById,
		isPending: isPendingById,
		error: testRegistryByIdError,
		isError: testRegistryByIdIsError,
	} = api.registry.testRegistryById.useMutation();
	const form = useForm<AddRegistry>({
		defaultValues: {
			username: "",
			password: "",
			registryUrl: "",
			imagePrefix: "",
			registryName: "",
			serverId: "",
			isEditing: !!registryId,
		},
		resolver: zodResolver(
			AddRegistrySchema.refine(
				(data) => {
					// When creating a new registry, password is required
					if (
						!data.isEditing &&
						(!data.password || data.password.length === 0)
					) {
						return false;
					}
					return true;
				},
				{
					message: "Şifre gereklidir",
					path: ["password"],
				},
			),
		),
	});

	const password = form.watch("password");
	const username = form.watch("username");
	const registryUrl = form.watch("registryUrl");
	const registryName = form.watch("registryName");
	const imagePrefix = form.watch("imagePrefix");
	const serverId = form.watch("serverId");
	const selectedServer = servers?.find(
		(server) => server.serverId === serverId,
	);

	useEffect(() => {
		if (registry) {
			form.reset({
				username: registry.username,
				password: "",
				registryUrl: registry.registryUrl,
				imagePrefix: registry.imagePrefix || "",
				registryName: registry.registryName,
				isEditing: true,
			});
		} else {
			form.reset({
				username: "",
				password: "",
				registryUrl: "",
				imagePrefix: "",
				serverId: "",
				isEditing: false,
			});
		}
	}, [form, form.reset, form.formState.isSubmitSuccessful, registry]);

	const onSubmit = async (data: AddRegistry) => {
		const payload: any = {
			registryName: data.registryName,
			username: data.username,
			registryUrl: data.registryUrl || "",
			registryType: "cloud",
			imagePrefix: data.imagePrefix,
			serverId: data.serverId,
			registryId: registryId || "",
		};

		// Only include password if it's been provided (not empty)
		// When editing, empty password means "keep the existing password"
		if (data.password && data.password.length > 0) {
			payload.password = data.password;
		}

		await mutateAsync(payload)
			.then(async (_data) => {
				await utils.registry.all.invalidate();
				toast.success(registryId ? "Kayıt defteri güncellendi" : "Kayıt defteri eklendi");
				setIsOpen(false);
			})
			.catch(() => {
				toast.error(
					registryId ? "Kayıt defteri güncellenirken hata oluştu" : "Kayıt defteri eklenirken hata oluştu",
				);
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{registryId ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-blue-500/10 "
					>
						<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
					</Button>
				) : (
					<Button className="cursor-pointer space-x-3">
						<PlusIcon className="h-4 w-4" />
						Kayıt Defteri Ekle
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Harici kayıt defteri ekle</DialogTitle>
					<DialogDescription>
						Harici bir kayıt defteri eklemek için aşağıdaki alanları doldurun.
					</DialogDescription>
				</DialogHeader>
				{(isError || testRegistryIsError || testRegistryByIdIsError) && (
					<div className="flex flex-row gap-4 rounded-lg bg-red-50 p-2 dark:bg-red-950">
						<AlertTriangle className="text-red-600 dark:text-red-400" />
						<span className="text-sm text-red-600 dark:text-red-400">
							{testRegistryError?.message ||
								testRegistryByIdError?.message ||
								error?.message ||
								""}
						</span>
					</div>
				)}
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid grid-cols-1 sm:grid-cols-2 w-full gap-4"
					>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="registryName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kayıt Defteri Adı</FormLabel>
										<FormControl>
											<Input placeholder="Kayıt Defteri Adı" {...field} />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kullanıcı Adı</FormLabel>
										<FormControl>
											<Input
												placeholder="Kullanıcı Adı"
												autoComplete="username"
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Şifre{registryId && " (İsteğe bağlı)"}</FormLabel>
										{registryId && (
											<FormDescription>
												Mevcut şifreyi korumak için boş bırakın. Test etmek veya güncellemek için yeni şifre girin.
											</FormDescription>
										)}
										<FormControl>
											<Input
												placeholder={
													registryId
														? "Mevcut şifreyi korumak için boş bırakın"
														: "Şifre"
												}
												autoComplete="one-time-code"
												{...field}
												type="password"
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="imagePrefix"
								render={({ field }) => (
									<FormItem>
										<FormLabel>İmaj Öneki</FormLabel>
										<FormControl>
											<Input {...field} placeholder="İmaj Öneki" />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex flex-col gap-4  col-span-2">
							<FormField
								control={form.control}
								name="registryUrl"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Kayıt Defteri URL'si</FormLabel>
										<FormDescription>
											Yalnızca sunucu adını girin (ör.
											aws_account_id.dkr.ecr.us-west-2.amazonaws.com).
										</FormDescription>
										<FormControl>
											<Input
												placeholder="aws_account_id.dkr.ecr.us-west-2.amazonaws.com"
												{...field}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="col-span-2">
							<FormField
								control={form.control}
								name="serverId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sunucu {!isCloud && "(İsteğe bağlı)"}</FormLabel>
										<FormDescription>
											{!isCloud ? (
												<>
													{serverId && serverId !== "none" && selectedServer ? (
														<>
															Kimlik doğrulama şu sunucuda yapılacaktır:{" "}
															<strong>{selectedServer.name}</strong>. Bu kayıt defteri bu sunucuda kullanılabilir olacaktır.
														</>
													) : (
														<>
															Kayıt defteri ile kimlik doğrulamanın yapılacağı yeri seçin. Varsayılan olarak kimlik doğrulama Yurt sunucusunda yapılır. Bunun yerine belirli bir sunucudan kimlik doğrulamak için bir sunucu seçin.
														</>
													)}
												</>
											) : (
												<>
													{serverId && serverId !== "none" && selectedServer ? (
														<>
															Kimlik doğrulama şu sunucuda yapılacaktır:{" "}
															<strong>{selectedServer.name}</strong>. Bu kayıt defteri bu sunucuda kullanılabilir olacaktır.
														</>
													) : (
														<>
															Kayıt defteri ile kimlik doğrulama yapılacak sunucuyu seçin. Kimlik doğrulama seçilen sunucudan yapılacaktır.
														</>
													)}
												</>
											)}
										</FormDescription>
										<FormControl>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Bir sunucu seçin" />
												</SelectTrigger>
												<SelectContent>
													{deployServers && deployServers.length > 0 && (
														<SelectGroup>
															<SelectLabel>Dağıtım Sunucuları</SelectLabel>
															{deployServers.map((server) => (
																<SelectItem
																	key={server.serverId}
																	value={server.serverId}
																>
																	{server.name}
																</SelectItem>
															))}
														</SelectGroup>
													)}
													{buildServers && buildServers.length > 0 && (
														<SelectGroup>
															<SelectLabel>Derleme Sunucuları</SelectLabel>
															{buildServers.map((server) => (
																<SelectItem
																	key={server.serverId}
																	value={server.serverId}
																>
																	{server.name}
																</SelectItem>
															))}
														</SelectGroup>
													)}
													<SelectGroup>
														<SelectItem value={"none"}>Hiçbiri</SelectItem>
													</SelectGroup>
												</SelectContent>
											</Select>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<DialogFooter className="flex flex-col w-full sm:justify-between gap-4 flex-wrap sm:flex-col col-span-2">
							<div className="flex flex-row gap-2 justify-between">
								<Button
									type="button"
									variant={"secondary"}
									isLoading={isPending || isPendingById}
									onClick={async () => {
										// When editing with empty password, use the existing password from DB
										if (registryId && (!password || password.length === 0)) {
											await testRegistryById({
												registryId: registryId || "",
												...(serverId && { serverId }),
											})
												.then((data) => {
													if (data) {
														toast.success("Kayıt defteri testi başarılı");
													} else {
														toast.error("Kayıt defteri testi başarısız");
													}
												})
												.catch(() => {
													toast.error("Kayıt defteri test edilirken hata oluştu");
												});
											return;
										}

										// When creating, password is required
										if (!registryId && (!password || password.length === 0)) {
											form.setError("password", {
												type: "manual",
												message: "Şifre gereklidir",
											});
											return;
										}

										// When creating or editing with new password, validate and test with provided credentials
										const validationResult = AddRegistrySchema.safeParse({
											username,
											password,
											registryUrl,
											registryName: "Yurt Registry",
											imagePrefix,
											serverId,
											isEditing: !!registryId,
										});

										if (!validationResult.success) {
											for (const issue of validationResult.error.issues) {
												form.setError(issue.path[0] as any, {
													type: "manual",
													message: issue.message,
												});
											}
											return;
										}

										await testRegistry({
											username: username,
											password: password,
											registryUrl: registryUrl || "",
											registryName: registryName,
											registryType: "cloud",
											imagePrefix: imagePrefix,
											serverId: serverId,
										})
											.then((data) => {
												if (data) {
													toast.success("Kayıt defteri testi başarılı");
												} else {
													toast.error("Kayıt defteri testi başarısız");
												}
											})
											.catch(() => {
												toast.error("Kayıt defteri test edilirken hata oluştu");
											});
									}}
								>
									Kayıt Defterini Test Et
								</Button>
								<Button isLoading={form.formState.isSubmitting} type="submit">
									{registryId ? "Güncelle" : "Oluştur"}
								</Button>
							</div>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
