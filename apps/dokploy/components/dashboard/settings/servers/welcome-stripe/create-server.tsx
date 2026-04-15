import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DialogFooter } from "@/components/ui/dialog";
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
});

type Schema = z.infer<typeof Schema>;

interface Props {
	stepper: any;
}

export const CreateServer = ({ stepper }: Props) => {
	const { data: sshKeys } = api.sshKey.all.useQuery();
	const [isOpen, _setIsOpen] = useState(false);
	const { data: canCreateMoreServers, refetch } =
		api.stripe.canCreateMoreServers.useQuery();
	const { mutateAsync } = api.server.create.useMutation();
	const cloudSSHKey = sshKeys?.find(
		(sshKey) => sshKey.name === "dokploy-cloud-ssh-key",
	);

	const form = useForm<Schema>({
		defaultValues: {
			description: "Yurt Cloud Sunucusu",
			name: "İlk Sunucum",
			ipAddress: "",
			port: 22,
			username: "root",
			sshKeyId: cloudSSHKey?.sshKeyId || "",
		},
		resolver: zodResolver(Schema),
	});

	useEffect(() => {
		form.reset({
			description: "Yurt Cloud Sunucusu",
			name: "İlk Sunucum",
			ipAddress: "",
			port: 22,
			username: "root",
			sshKeyId: cloudSSHKey?.sshKeyId || "",
		});
	}, [form, form.reset, form.formState.isSubmitSuccessful, sshKeys]);

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
			serverType: "deploy",
		})
			.then(async (_data) => {
				toast.success("Sunucu Oluşturuldu");
				stepper.next();
			})
			.catch(() => {
				toast.error("Sunucu oluşturulurken hata oluştu");
			});
	};
	return (
		<Card className="bg-background flex flex-col gap-4">
			<div className="flex flex-col gap-2 pt-5 px-4">
				{!canCreateMoreServers && (
					<AlertBlock type="warning" className="mt-2">
						Daha fazla sunucu oluşturamazsınız,{" "}
						<Link href="/dashboard/settings/billing" className="text-primary">
							Lütfen planınızı yükseltin
						</Link>
					</AlertBlock>
				)}
			</div>

			<CardContent className="flex flex-col">
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
							name="sshKeyId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>SSH Anahtarı Seçin</FormLabel>
									{!cloudSSHKey && (
										<AlertBlock>
											Henüz SSH Anahtarınız yok gibi görünüyor, bir tane oluşturabilirsiniz{" "}
											<Link
												href="/dashboard/settings/ssh-keys"
												className="text-primary"
											>
												buradan
											</Link>
										</AlertBlock>
									)}

									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<SelectTrigger>
											<SelectValue placeholder="SSH Anahtarı Seçin" />
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
													SSH Anahtarları ({sshKeys?.length})
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

									<FormMessage />
								</FormItem>
							)}
						/>
					</form>

					<DialogFooter>
						<Button
							isLoading={form.formState.isSubmitting}
							disabled={!canCreateMoreServers}
							form="hook-form-add-server"
							type="submit"
						>
							Oluştur
						</Button>
					</DialogFooter>
				</Form>
			</CardContent>
		</Card>
	);
};
