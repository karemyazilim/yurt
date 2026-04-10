import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
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
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { api } from "@/utils/api";

const addInvitation = z
	.object({
		mode: z.enum(["invitation", "credentials"]),
		email: z
			.string()
			.min(1, "E-posta gereklidir")
			.email({ message: "Geçersiz e-posta" }),
		role: z.string().min(1, "Rol gereklidir"),
		notificationId: z.string().optional(),
		password: z.string().optional(),
		confirmPassword: z.string().optional(),
	})
	.superRefine((value, ctx) => {
		if (value.mode !== "credentials") {
			return;
		}

		if (!value.password) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Şifre gereklidir",
				path: ["password"],
			});
		} else if (value.password.length < 8) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Şifre en az 8 karakter olmalıdır",
				path: ["password"],
			});
		}

		if (!value.confirmPassword) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Şifre tekrarı gereklidir",
				path: ["confirmPassword"],
			});
		} else if (value.confirmPassword.length < 8) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Şifre en az 8 karakter olmalıdır",
				path: ["confirmPassword"],
			});
		}

		if (
			value.password &&
			value.confirmPassword &&
			value.password !== value.confirmPassword
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Şifreler eşleşmiyor",
				path: ["confirmPassword"],
			});
		}
	});

type AddInvitation = z.infer<typeof addInvitation>;

export const AddInvitation = () => {
	const [open, setOpen] = useState(false);
	const utils = api.useUtils();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: emailProviders } =
		api.notification.getEmailProviders.useQuery();
	const { mutateAsync: inviteMember, isPending: isInviting } =
		api.organization.inviteMember.useMutation();
	const { mutateAsync: sendInvitation } = api.user.sendInvitation.useMutation();
	const { mutateAsync: createUserWithCredentials, isPending: isCreating } =
		api.user.createUserWithCredentials.useMutation();
	const { data: customRoles } = api.customRole.all.useQuery();
	const [error, setError] = useState<string | null>(null);

	const form = useForm<AddInvitation>({
		defaultValues: {
			mode: "invitation",
			email: "",
			role: "member",
			notificationId: "",
			password: "",
			confirmPassword: "",
		},
		resolver: zodResolver(addInvitation),
	});

	const mode = form.watch("mode");

	useEffect(() => {
		form.reset();
	}, [form, form.formState.isSubmitSuccessful, form.reset]);

	useEffect(() => {
		if (isCloud && form.getValues("mode") === "credentials") {
			form.setValue("mode", "invitation");
		}
	}, [form, isCloud]);

	const onSubmit = async (data: AddInvitation) => {
		setError(null);

		try {
			if (data.mode === "credentials") {
				await createUserWithCredentials({
					email: data.email.toLowerCase(),
					password: data.password!,
					role: data.role,
				});
				toast.success("Kullanıcı başlangıç kimlik bilgileriyle oluşturuldu");
				setOpen(false);
			} else {
				const result = await inviteMember({
					email: data.email.toLowerCase(),
					role: data.role,
				});

				if (!isCloud && data.notificationId) {
					await sendInvitation({
						invitationId: result!.id,
						notificationId: data.notificationId || "",
					})
						.then(() => {
							toast.success("Davetiye oluşturuldu ve e-posta gönderildi");
						})
						.catch((error: any) => {
							toast.error(error.message);
						});
				} else {
					toast.success("Davetiye oluşturuldu");
				}

				setOpen(false);
			}
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Kullanıcı oluşturulamadı";
			setError(message);
			toast.error(message);
		} finally {
			await Promise.all([
				utils.organization.allInvitations.invalidate(),
				utils.user.all.invalidate(),
			]);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger className="" asChild>
				<Button>
					<PlusIcon className="h-4 w-4" /> Davetiye Ekle
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Davetiye Ekle</DialogTitle>
					<DialogDescription>
						{mode === "credentials"
							? "Başlangıç kimlik bilgileriyle kullanıcı oluşturun"
							: "Yeni bir kullanıcı davet edin"}
					</DialogDescription>
				</DialogHeader>
				{error && <AlertBlock type="error">{error}</AlertBlock>}

				<Form {...form}>
					<form
						id="hook-form-add-invitation"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4 "
					>
						{!isCloud && (
							<FormField
								control={form.control}
								name="mode"
								render={({ field }) => {
									return (
										<FormItem>
											<FormLabel>Davet Yöntemi</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Davet yöntemi seçin" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="invitation">
														Davet Bağlantısı
													</SelectItem>
													<SelectItem value="credentials">
														Başlangıç Kimlik Bilgileri
													</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												Davet bağlantısı veya doğrudan kimlik bilgileri
												sağlama arasında seçim yapın
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						)}

						<FormField
							control={form.control}
							name="email"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>E-posta</FormLabel>
										<FormControl>
											<Input placeholder={"email@dokploy.com"} {...field} />
										</FormControl>
										<FormDescription>
											Bu, yeni kullanıcının e-posta adresi olacaktır
										</FormDescription>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						<FormField
							control={form.control}
							name="role"
							render={({ field }) => {
								return (
									<FormItem>
										<FormLabel>Rol</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Bir rol seçin" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="member">Üye</SelectItem>
												<SelectItem value="admin">Yönetici</SelectItem>
												{customRoles?.map((role) => (
													<SelectItem key={role.role} value={role.role}>
														{role.role}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormDescription>
											Yeni kullanıcı için rol seçin
										</FormDescription>
										<FormMessage />
									</FormItem>
								);
							}}
						/>

						{!isCloud && mode === "invitation" && (
							<FormField
								control={form.control}
								name="notificationId"
								render={({ field }) => {
									return (
										<FormItem>
											<FormLabel>E-posta Sağlayıcısı</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="E-posta sağlayıcısı seçin" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													{emailProviders?.map((provider) => (
														<SelectItem
															key={provider.notificationId}
															value={provider.notificationId}
														>
															{provider.name}
														</SelectItem>
													))}
													<SelectItem value="none" disabled>
														Yok
													</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												Davetiyeyi göndermek için e-posta sağlayıcısı seçin
											</FormDescription>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
						)}

						{!isCloud && mode === "credentials" && (
							<>
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel>Şifre</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="Başlangıç şifresini girin"
														{...field}
													/>
												</FormControl>
												<FormDescription>
													Kullanıcı bu şifre ile hemen giriş yapabilir
												</FormDescription>
												<FormMessage />
											</FormItem>
										);
									}}
								/>

								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => {
										return (
											<FormItem>
												<FormLabel>Şifre Tekrar</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="Başlangıç şifresini onaylayın"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										);
									}}
								/>
							</>
						)}

						<DialogFooter className="flex w-full flex-row">
							<Button
								isLoading={isInviting || isCreating}
								form="hook-form-add-invitation"
								type="submit"
							>
								Oluştur
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
