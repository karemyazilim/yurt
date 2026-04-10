import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";

const DockerProviderSchema = z.object({
	externalPort: z.preprocess((a) => {
		if (a !== null) {
			const parsed = Number.parseInt(z.string().parse(a), 10);
			return Number.isNaN(parsed) ? null : parsed;
		}
		return null;
	}, z
		.number()
		.gte(0, "Aralık 0 - 65535 olmalıdır")
		.lte(65535, "Aralık 0 - 65535 olmalıdır")
		.nullable()),
});

type DockerProvider = z.infer<typeof DockerProviderSchema>;

interface Props {
	mongoId: string;
}
export const ShowExternalMongoCredentials = ({ mongoId }: Props) => {
	const { data: ip } = api.settings.getIp.useQuery();
	const { data, refetch } = api.mongo.one.useQuery({ mongoId });
	const { mutateAsync, isPending } = api.mongo.saveExternalPort.useMutation();
	const [connectionUrl, setConnectionUrl] = useState("");
	const getIp = data?.server?.ipAddress || ip;
	const form = useForm({
		defaultValues: {},
		resolver: zodResolver(DockerProviderSchema),
	});

	useEffect(() => {
		if (data?.externalPort) {
			form.reset({
				externalPort: data.externalPort,
			});
		}
	}, [form.reset, data, form]);

	const onSubmit = async (values: DockerProvider) => {
		await mutateAsync({
			externalPort: values.externalPort,
			mongoId,
		})
			.then(async () => {
				toast.success("Harici Port güncellendi");
				await refetch();
			})
			.catch((error: Error) => {
				toast.error(error?.message || "Harici port kaydedilirken hata oluştu");
			});
	};

	useEffect(() => {
		const buildConnectionUrl = () => {
			const port = form.watch("externalPort") || data?.externalPort;

			const params = `authSource=admin${data?.replicaSets ? "" : "&directConnection=true"}`;
			return `mongodb://${data?.databaseUser}:${data?.databasePassword}@${getIp}:${port}/?${params}`;
		};

		setConnectionUrl(buildConnectionUrl());
	}, [
		data?.appName,
		data?.externalPort,
		data?.databasePassword,
		form,
		data?.databaseUser,
		getIp,
	]);

	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">Harici Kimlik Bilgileri</CardTitle>
						<CardDescription>
							Veritabanını internet üzerinden erişilebilir hale getirmek için
							bir port belirlemeniz ve bu portun başka bir uygulama veya
							veritabanı tarafından kullanılmadığından emin olmanız gerekir
						</CardDescription>
					</CardHeader>
					<CardContent className="flex w-full flex-col gap-4">
						{!getIp && (
							<AlertBlock type="warning">
								Veritabanı bağlantı URL'sini düzeltmek için{" "}
								<Link
									href="/dashboard/settings/server"
									className="text-primary"
								>
									{data?.serverId
										? "Uzak Sunucular -> Sunucu -> Sunucuyu Düzenle -> IP Adresini Güncelle"
										: "Web Sunucusu -> Sunucu -> Sunucu IP'sini Güncelle"}
								</Link>{" "}
								bölümünden bir IP adresi belirlemeniz gerekiyor.
							</AlertBlock>
						)}
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="flex flex-col gap-4"
							>
								<div className="grid grid-cols-2 gap-4 ">
									<div className="col-span-2 space-y-4">
										<FormField
											control={form.control}
											name="externalPort"
											render={({ field }) => {
												return (
													<FormItem>
														<FormLabel>Harici Port (İnternet)</FormLabel>
														<FormControl>
															<Input
																placeholder="27017"
																{...field}
																value={field.value as string}
															/>
														</FormControl>
														<FormMessage />
													</FormItem>
												);
											}}
										/>
									</div>
								</div>
								{!!data?.externalPort && (
									<div className="grid w-full gap-8">
										<div className="flex flex-col gap-3">
											<Label>Harici Sunucu</Label>
											<ToggleVisibilityInput value={connectionUrl} disabled />
										</div>
									</div>
								)}

								<div className="flex justify-end">
									<Button type="submit" isLoading={isPending}>
										Kaydet
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			</div>
		</>
	);
};
