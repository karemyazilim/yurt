import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Pencil, PlusIcon } from "lucide-react";
import Link from "next/link";
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
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
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
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

const Schema = z.object({
	name: z.string().min(1, {
		message: "Ad gereklidir",
	}),
	description: z.string().optional(),
	ipAddress: z.string().min(1, {
		message: "IP Adresi gereklidir",
	}),
	port: z.number().optional(),
	username: z.string().optional(),
	sshKeyId: z.string().min(1, {
		message: "SSH Anahtarı gereklidir",
	}),
	serverType: z.enum(["deploy", "build"]).default("deploy"),
});

type Schema = z.infer<typeof Schema>;

interface Props {
	serverId?: string;
	asButton?: boolean;
}

export const HandleServers = ({ serverId, asButton = false }: Props) => {
	const utils = api.useUtils();
	const [isOpen, setIsOpen] = useState(false);
	const { data: canCreateMoreServers, refetch } =
		api.stripe.canCreateMoreServers.useQuery();

	const { data, refetch: refetchServer } = api.server.one.useQuery(
		{
			serverId: serverId || "",
		},
		{
			enabled: !!serverId,
		},
	);

	const { data: sshKeys } = api.sshKey.all.useQuery();
	const { mutateAsync, error, isPending, isError } = serverId
		? api.server.update.useMutation()
		: api.server.create.useMutation();
	const form = useForm({
		defaultValues: {
			description: "",
			name: "",
			ipAddress: "",
			port: 22,
			username: "root",
			sshKeyId: "",
			serverType: "deploy",
		},
		resolver: zodResolver(Schema),
	});

	useEffect(() => {
		form.reset({
			description: data?.description || "",
			name: data?.name || "",
			ipAddress: data?.ipAddress || "",
			port: data?.port || 22,
			username: data?.username || "root",
			sshKeyId: data?.sshKeyId || "",
			serverType: data?.serverType || "deploy",
		});
	}, [form, form.reset, form.formState.isSubmitSuccessful, data]);

	useEffect(() => {
		refetch();
	}, [isOpen]);

	const onSubmit = async (data: Schema) => {
		await mutateAsync({
			name: data.name,
			description: data.description || "",
			ipAddress: data.ipAddress?.trim() || "",
			port: data.port || 22,
			username: data.username || "root",
			sshKeyId: data.sshKeyId || "",
			serverType: data.serverType || "deploy",
			serverId: serverId || "",
		})
			.then(async (_data) => {
				await utils.server.all.invalidate();
				refetchServer();
				toast.success(serverId ? "Sunucu Güncellendi" : "Sunucu Oluşturuldu");
				setIsOpen(false);
			})
			.catch(() => {
				toast.error(
					serverId ? "Sunucu güncellenirken hata oluştu" : "Sunucu oluşturulurken hata oluştu",
				);
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{serverId ? (
				asButton ? (
					<DialogTrigger asChild>
						<Button variant="outline" size="icon" className="h-9 w-9">
							<Pencil className="h-4 w-4" />
						</Button>
					</DialogTrigger>
				) : (
					<DropdownMenuItem
						className="w-full cursor-pointer "
						onSelect={(e) => {
							e.preventDefault();
							setIsOpen(true);
						}}
					>
						Sunucuyu Düzenle
					</DropdownMenuItem>
				)
			) : (
				<DialogTrigger asChild>
					<Button className="cursor-pointer space-x-3">
						<PlusIcon className="h-4 w-4" />
						Sunucu Oluştur
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-3xl ">
				<DialogHeader>
					<DialogTitle>{serverId ? "Düzenle" : "Oluştur"} Sunucu</DialogTitle>
					<DialogDescription>
						Uygulamalarınızı uzaktan dağıtmak için bir sunucu {serverId ? "düzenleyin" : "oluşturun"}.
					</DialogDescription>
				</DialogHeader>
				<div>
					<p className="text-primary text-sm font-medium">
						Devam etmek için bir Sanal Özel Sunucu (VPS) satın almanız veya kiralamanız gerekebilir. Yoğun şekilde test edilmiş bu sağlayıcılardan birini kullanmanızı öneririz:
					</p>
					<ul className="list-inside list-disc pl-4 text-sm text-muted-foreground mt-4">
						<li>
							<a
								href="https://www.hostinger.com/vps-hosting?REFERRALCODE=1SIUMAURICI97"
								className="text-link underline"
							>
								Hostinger - %20 İndirim Alın
							</a>
						</li>
						<li>
							<a
								href=" https://app.americancloud.com/register?ref=dokploy"
								className="text-link underline"
							>
								American Cloud - $20 Kredi Alın
							</a>
						</li>
						<li>
							<a
								href="https://m.do.co/c/db24efd43f35"
								className="text-link underline"
							>
								DigitalOcean - $200 Kredi Alın
							</a>
						</li>
						<li>
							<a
								href="https://hetzner.cloud/?ref=vou4fhxJ1W2D"
								className="text-link underline"
							>
								Hetzner - €20 Kredi Alın
							</a>
						</li>
						<li>
							<a
								href="https://www.vultr.com/?ref=9679828"
								className="text-link underline"
							>
								Vultr
							</a>
						</li>
						<li>
							<a
								href="https://www.linode.com/es/pricing/#compute-shared"
								className="text-link underline"
							>
								Linode
							</a>
						</li>
					</ul>
					<AlertBlock className="mt-4 px-4">
						Herhangi bir sağlayıcıyı kullanmakta özgürsünüz, ancak sorunlardan kaçınmak için yukarıdakilerden birini kullanmanızı öneririz.
					</AlertBlock>
				</div>
				{!canCreateMoreServers && (
					<AlertBlock type="warning" className="mt-4">
						Daha fazla sunucu oluşturamazsınız,{" "}
						<Link href="/dashboard/settings/billing" className="text-primary">
							Lütfen planınızı yükseltin
						</Link>
					</AlertBlock>
				)}
				{isError && <AlertBlock type="error">{error?.message}</AlertBlock>}
				<Form {...form}>
					<form
						id="hook-form-add-server"
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-4"
					>
						<div className="flex flex-col gap-4 ">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Ad</FormLabel>
										<FormControl>
											<Input placeholder="Hostinger Sunucusu" {...field} />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Açıklama</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Bu sunucu veritabanları için..."
											className="resize-none"
											{...field}
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="serverType"
							render={({ field }) => {
								const serverTypeValue = form.watch("serverType");
								return (
									<FormItem>
										<FormLabel>Sunucu Türü</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder="Bir sunucu türü seçin" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="deploy">Dağıtım Sunucusu</SelectItem>
													<SelectItem value="build">Derleme Sunucusu</SelectItem>
													<SelectLabel>Sunucu Türü</SelectLabel>
												</SelectGroup>
											</SelectContent>
										</Select>
										<FormMessage />
										{serverTypeValue === "deploy" && (
											<AlertBlock type="info" className="mt-2">
												Dağıtım sunucuları uygulamalarınızı, veritabanlarınızı ve hizmetlerinizi çalıştırmak için kullanılır. Projelerinizin dağıtımını ve çalıştırılmasını yönetirler.
											</AlertBlock>
										)}
										{serverTypeValue === "build" && (
											<AlertBlock type="info" className="mt-2">
												Derleme sunucuları uygulamalarınızı derlemek için ayrılmıştır. Derleme ve yapılandırma sürecini yönetir, bu işi dağıtım sunucularınızdan alır. Derleme sunucuları dağıtım seçeneklerinde görünmez.
											</AlertBlock>
										)}
									</FormItem>
								);
							}}
						/>
						<FormField
							control={form.control}
							name="sshKeyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Bir SSH Anahtarı Seçin</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="Bir SSH Anahtarı Seçin" />
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
												<SelectLabel>
													Kayıtlar ({sshKeys?.length})
												</SelectLabel>
											</SelectGroup>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="ipAddress"
								render={({ field }) => (
									<FormItem>
										<FormLabel>IP Adresi</FormLabel>
										<FormControl>
											<Input placeholder="192.168.1.100" {...field} />
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="port"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Port</FormLabel>
										<FormControl>
											<Input
												placeholder="22"
												{...field}
												onChange={(e) => {
													const value = e.target.value;
													if (value === "") {
														field.onChange(0);
													} else {
														const number = Number.parseInt(value, 10);
														if (!Number.isNaN(number)) {
															field.onChange(number);
														}
													}
												}}
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="username"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Kullanıcı Adı</FormLabel>
									<FormControl>
										<Input placeholder="root" {...field} />
									</FormControl>
									<FormDescription>
										&quot;root&quot; veya parolasız sudo erişimine sahip root olmayan bir kullanıcı kullanın.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</form>

					<DialogFooter>
						<Button
							isLoading={isPending}
							disabled={!canCreateMoreServers && !serverId}
							form="hook-form-add-server"
							type="submit"
						>
							{serverId ? "Güncelle" : "Oluştur"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
