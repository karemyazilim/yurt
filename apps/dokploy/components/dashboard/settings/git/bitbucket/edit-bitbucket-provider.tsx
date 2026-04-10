import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { PenBoxIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { BitbucketIcon } from "@/components/icons/data-tools-icons";
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
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { api } from "@/utils/api";

const Schema = z.object({
	name: z.string().min(1, {
		message: "Name is required",
	}),
	username: z.string().min(1, {
		message: "Username is required",
	}),
	email: z.string().email().optional(),
	workspaceName: z.string().optional(),
	apiToken: z.string().optional(),
	appPassword: z.string().optional(),
});

type Schema = z.infer<typeof Schema>;

interface Props {
	bitbucketId: string;
}

export const EditBitbucketProvider = ({ bitbucketId }: Props) => {
	const { data: bitbucket } = api.bitbucket.one.useQuery(
		{
			bitbucketId,
		},
		{
			enabled: !!bitbucketId,
		},
	);

	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const { mutateAsync, error, isError } = api.bitbucket.update.useMutation();
	const { mutateAsync: testConnection, isPending } =
		api.bitbucket.testConnection.useMutation();
	const form = useForm<Schema>({
		defaultValues: {
			username: "",
			email: "",
			workspaceName: "",
			apiToken: "",
			appPassword: "",
		},
		resolver: zodResolver(Schema),
	});

	const username = form.watch("username");
	const email = form.watch("email");
	const workspaceName = form.watch("workspaceName");
	const apiToken = form.watch("apiToken");
	const appPassword = form.watch("appPassword");

	useEffect(() => {
		form.reset({
			username: bitbucket?.bitbucketUsername || "",
			email: bitbucket?.bitbucketEmail || "",
			workspaceName: bitbucket?.bitbucketWorkspaceName || "",
			name: bitbucket?.gitProvider.name || "",
			apiToken: bitbucket?.apiToken || "",
			appPassword: bitbucket?.appPassword || "",
		});
	}, [form, isOpen, bitbucket]);

	const onSubmit = async (data: Schema) => {
		await mutateAsync({
			bitbucketId,
			gitProviderId: bitbucket?.gitProviderId || "",
			bitbucketUsername: data.username,
			bitbucketEmail: data.email || "",
			bitbucketWorkspaceName: data.workspaceName || "",
			name: data.name || "",
			apiToken: data.apiToken || "",
			appPassword: data.appPassword || "",
		})
			.then(async () => {
				await utils.gitProvider.getAll.invalidate();
				toast.success("Bitbucket başarıyla güncellendi");
				setIsOpen(false);
			})
			.catch(() => {
				toast.error("Bitbucket güncellenirken hata oluştu");
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="group hover:bg-blue-500/10 "
				>
					<PenBoxIcon className="size-3.5  text-primary group-hover:text-blue-500" />
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl ">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						Bitbucket'ı Güncelle <BitbucketIcon className="size-5" />
					</DialogTitle>
				</DialogHeader>

				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						id="hook-form-add-bitbucket"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-1"
					>
						<CardContent className="p-0">
							<div className="flex flex-col gap-4">
								<p className="text-muted-foreground text-sm">
									Bitbucket kimlik doğrulamanızı güncelleyin. Gelişmiş güvenlik
									için API Token (önerilen) veya eski destek için Uygulama Şifresi
									kullanın.
								</p>

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
									name="username"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Bitbucket Kullanıcı Adı</FormLabel>
											<FormControl>
												<Input
													placeholder="Your Bitbucket username"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel>E-posta (API Token'ları İçin Gerekli)</FormLabel>
											<FormControl>
												<Input
													type="email"
													placeholder="Your Bitbucket email address"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="workspaceName"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Çalışma Alanı Adı (İsteğe Bağlı)</FormLabel>
											<FormControl>
												<Input
													placeholder="For organization accounts"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<div className="flex flex-col gap-2 border-t pt-4">
									<h3 className="text-sm font-medium mb-2">
										Kimlik Doğrulama (API Token Kullanmak İçin Güncelleyin)
									</h3>
									<FormField
										control={form.control}
										name="apiToken"
										render={({ field }) => (
											<FormItem>
												<FormLabel>API Token (Önerilen)</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="Enter your Bitbucket API Token"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="appPassword"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Uygulama Şifresi (Eski - Haziran 2026'da kullanımdan kaldırılacak)
												</FormLabel>
												<FormControl>
													<Input
														type="password"
														placeholder="Enter your Bitbucket App Password"
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<div className="flex w-full justify-between gap-4 mt-4">
									<Button
										type="button"
										variant={"secondary"}
										isLoading={isPending}
										onClick={async () => {
											await testConnection({
												bitbucketId,
												bitbucketUsername: username,
												bitbucketEmail: email,
												workspaceName: workspaceName,
												apiToken: apiToken,
												appPassword: appPassword,
											})
												.then(async (message) => {
													toast.info(`Message: ${message}`);
												})
												.catch((error) => {
													toast.error(`Error: ${error.message}`);
												});
										}}
									>
										Bağlantıyı Test Et
									</Button>
									<Button type="submit" isLoading={form.formState.isSubmitting}>
										Güncelle
									</Button>
								</div>
							</div>
						</CardContent>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
