import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Eye, EyeOff, LayoutDashboardIcon, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@/components/ui/command";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input, NumberInput } from "@/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/utils/api";
import { useUrl } from "@/utils/hooks/use-url";
import { extractServices } from "../users/add-permissions";

interface Props {
	serverId?: string;
}

const Schema = z.object({
	metricsConfig: z.object({
		server: z.object({
			refreshRate: z.number().min(2, {
				message: "Sunucu Yenileme Hızı gereklidir",
			}),
			port: z.number().min(1, {
				message: "Port gereklidir",
			}),
			token: z.string(),
			urlCallback: z.string(),
			retentionDays: z.number().min(1, {
				message: "Saklama süresi en az 1 gün olmalıdır",
			}),
			thresholds: z.object({
				cpu: z.number().min(0),
				memory: z.number().min(0),
			}),
			cronJob: z.string().min(1, {
				message: "Zamanlanmış Görev gereklidir",
			}),
		}),
		containers: z.object({
			refreshRate: z.number().min(2, {
				message: "Konteyner Yenileme Hızı gereklidir",
			}),
			services: z.object({
				include: z.array(z.string()).optional(),
				exclude: z.array(z.string()).optional(),
			}),
		}),
	}),
});

type Schema = z.infer<typeof Schema>;

export const SetupMonitoring = ({ serverId }: Props) => {
	const { data: serverData } = serverId
		? api.server.one.useQuery(
				{
					serverId: serverId || "",
				},
				{
					enabled: !!serverId,
				},
			)
		: { data: null };

	const { data: webServerSettings } =
		api.settings.getWebServerSettings.useQuery(undefined, {
			enabled: !serverId,
		});

	const data = serverId ? serverData : webServerSettings;

	const url = useUrl();

	const { data: projects } = api.project.allForPermissions.useQuery();

	const extractServicesFromProjects = () => {
		if (!projects) return [];

		const allServices = projects.flatMap((project) => {
			const services = project.environments.flatMap((env) =>
				extractServices(env),
			);
			return serverId
				? services
						.filter((service) => service.serverId === serverId)
						.map((service) => service.appName)
				: services.map((service) => service.appName);
		});

		return [...new Set(allServices)];
	};

	const services = extractServicesFromProjects();

	const form = useForm<Schema>({
		resolver: zodResolver(Schema),
		defaultValues: {
			metricsConfig: {
				server: {
					refreshRate: 20,
					port: 4500,
					token: "",
					urlCallback: `${url}/api/trpc/notification.receiveNotification`,
					retentionDays: 7,
					thresholds: {
						cpu: 0,
						memory: 0,
					},
					cronJob: "",
				},
				containers: {
					refreshRate: 20,
					services: {
						include: [],
						exclude: [],
					},
				},
			},
		},
	});

	useEffect(() => {
		if (data) {
			form.reset({
				metricsConfig: {
					server: {
						refreshRate: data?.metricsConfig?.server?.refreshRate,
						port: data?.metricsConfig?.server?.port,
						token: data?.metricsConfig?.server?.token || generateToken(),
						urlCallback:
							data?.metricsConfig?.server?.urlCallback ||
							`${url}/api/trpc/notification.receiveNotification`,
						retentionDays: data?.metricsConfig?.server?.retentionDays || 5,
						thresholds: {
							cpu: data?.metricsConfig?.server?.thresholds?.cpu,
							memory: data?.metricsConfig?.server?.thresholds?.memory,
						},
						cronJob: data?.metricsConfig?.server?.cronJob || "0 0 * * *",
					},
					containers: {
						refreshRate: data?.metricsConfig?.containers?.refreshRate,
						services: {
							include: data?.metricsConfig?.containers?.services?.include,
							exclude: data?.metricsConfig?.containers?.services?.exclude,
						},
					},
				},
			});
		}
	}, [data, url]);

	const [search, setSearch] = useState("");
	const [searchExclude, setSearchExclude] = useState("");
	const [showToken, setShowToken] = useState(false);

	const availableServices = services?.filter(
		(service) =>
			!form
				.watch("metricsConfig.containers.services.include")
				?.some((s) => s === service) &&
			!form
				.watch("metricsConfig.containers.services.exclude")
				?.includes(service) &&
			service.toLowerCase().includes(search.toLowerCase()),
	);

	const availableServicesToExclude = [
		...(services?.filter(
			(service) =>
				!form
					.watch("metricsConfig.containers.services.exclude")
					?.includes(service) &&
				!form
					.watch("metricsConfig.containers.services.include")
					?.some((s) => s === service) &&
				service.toLowerCase().includes(searchExclude.toLowerCase()),
		) ?? []),
		...(!form.watch("metricsConfig.containers.services.exclude")?.includes("*")
			? ["*"]
			: []),
	];

	const { mutateAsync } = serverId
		? api.server.setupMonitoring.useMutation()
		: api.admin.setupMonitoring.useMutation();

	const generateToken = () => {
		const array = new Uint8Array(64);
		crypto.getRandomValues(array);
		return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
			"",
		);
	};

	const onSubmit = async (values: Schema) => {
		await mutateAsync({
			serverId: serverId || "",
			metricsConfig: values.metricsConfig,
		})
			.then(() => {
				toast.success("Sunucu başarıyla güncellendi");
			})
			.catch(() => {
				toast.error("Sunucu güncellenirken hata oluştu");
			});
	};

	return (
		<>
			<CardHeader className="">
				<CardTitle className="text-xl flex flex-row gap-2">
					<LayoutDashboardIcon className="size-6 text-muted-foreground self-center" />
					İzleme
				</CardTitle>
				<CardDescription>
					Sunucularınızı ve konteynerlerinizi gerçek zamanlı olarak izleyin,
					eşik değerlerine ulaştıklarında bildirim alın.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6 py-6 border-t">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex w-full flex-col gap-4"
					>
						<AlertBlock>
							Daha düşük bir yenileme hızı CPU ve bellek kullanımınızı
							artırır, 30-60 saniye öneriyoruz
						</AlertBlock>
						<div className="flex flex-col gap-4">
							<FormField
								control={form.control}
								name="metricsConfig.server.refreshRate"
								render={({ field }) => (
									<FormItem className="flex flex-col justify-center max-sm:items-center">
										<FormLabel>Sunucu Yenileme Hızı</FormLabel>
										<FormControl>
											<NumberInput placeholder="10" {...field} />
										</FormControl>
										<FormDescription>
											Lütfen sunucu için yenileme hızını saniye cinsinden ayarlayın
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.containers.refreshRate"
								render={({ field }) => (
									<FormItem className="flex flex-col justify-center max-sm:items-center">
										<FormLabel>Konteyner Yenileme Hızı</FormLabel>
										<FormControl>
											<NumberInput placeholder="10" {...field} />
										</FormControl>
										<FormDescription>
											Lütfen konteynerler için yenileme hızını saniye cinsinden ayarlayın
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.server.cronJob"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Zamanlanmış Görev</FormLabel>
										<FormControl>
											<Input {...field} placeholder="0 0 * * *" />
										</FormControl>
										<FormDescription>
											Metrikleri temizlemek için zamanlanmış görev
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.server.retentionDays"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Sunucu Saklama Süresi (Gün)</FormLabel>
										<FormControl>
											<NumberInput {...field} />
										</FormControl>
										<FormDescription>
											Sunucu metrik verilerinin saklanacağı gün sayısı
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="metricsConfig.server.port"
								render={({ field }) => (
									<FormItem className="flex flex-col justify-center max-sm:items-center">
										<FormLabel>Port</FormLabel>
										<FormControl>
											<NumberInput placeholder="4500" {...field} />
										</FormControl>
										<FormDescription>
											Lütfen metrik sunucusu için portu ayarlayın
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="metricsConfig.containers.services.include"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Dahil Edilecek Hizmetler</FormLabel>
										<FormControl>
											<div className="flex flex-col gap-4">
												<div className="flex gap-2">
													<Popover>
														<PopoverTrigger asChild>
															<Button variant="outline">Hizmet Ekle</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-[300px] p-0"
															align="start"
														>
															<Command>
																<CommandInput
																	placeholder="Hizmet ara..."
																	value={search}
																	onValueChange={setSearch}
																/>
																{availableServices?.length === 0 ? (
																	<div className="p-4 text-sm text-muted-foreground">
																		Kullanılabilir hizmet yok.
																	</div>
																) : (
																	<>
																		<CommandEmpty>
																			Hizmet bulunamadı.
																		</CommandEmpty>
																		<CommandGroup>
																			{availableServices?.map((service) => (
																				<CommandItem
																					key={service}
																					value={service}
																					onSelect={() => {
																						field.onChange([
																							...(field.value ?? []),
																							service,
																						]);
																						setSearch("");
																					}}
																				>
																					{service}
																				</CommandItem>
																			))}
																		</CommandGroup>
																	</>
																)}
															</Command>
														</PopoverContent>
													</Popover>
												</div>
												<div className="flex flex-wrap gap-2">
													{field.value?.map((service) => (
														<Badge
															key={service}
															variant="secondary"
															className="flex items-center gap-2"
														>
															{service}
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-4 w-4 p-0"
																onClick={() => {
																	field.onChange(
																		field.value?.filter((s) => s !== service),
																	);
																}}
															>
																×
															</Button>
														</Badge>
													))}
													<FormDescription>
														İzlenecek hizmetler.
													</FormDescription>
												</div>
											</div>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.containers.services.exclude"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Hariç Tutulacak Hizmetler</FormLabel>
										<FormControl>
											<div className="flex flex-col gap-4">
												<div className="flex gap-2">
													<Popover>
														<PopoverTrigger asChild>
															<Button variant="outline">Hizmet Ekle</Button>
														</PopoverTrigger>
														<PopoverContent
															className="w-[300px] p-0"
															align="start"
														>
															<Command>
																<CommandInput
																	placeholder="Hizmet ara..."
																	value={searchExclude}
																	onValueChange={setSearchExclude}
																/>
																{availableServicesToExclude?.length === 0 ? (
																	<div className="p-4 text-sm text-muted-foreground">
																		Kullanılabilir hizmet yok.
																	</div>
																) : (
																	<>
																		<CommandEmpty>
																			Hizmet bulunamadı.
																		</CommandEmpty>
																		<CommandGroup>
																			{availableServicesToExclude.map(
																				(service) => (
																					<CommandItem
																						key={service}
																						value={service}
																						onSelect={() => {
																							field.onChange([
																								...(field.value ?? []),
																								service,
																							]);
																							setSearchExclude("");
																						}}
																					>
																						{service}
																					</CommandItem>
																				),
																			)}
																		</CommandGroup>
																	</>
																)}
															</Command>
														</PopoverContent>
													</Popover>
												</div>
												<div className="flex flex-wrap gap-2">
													{field.value?.map((service, index) => (
														<Badge
															key={service}
															variant="secondary"
															className="flex items-center gap-2"
														>
															{service}
															<Button
																type="button"
																variant="ghost"
																size="icon"
																className="h-4 w-4 p-0"
																onClick={() => {
																	field.onChange(
																		field.value?.filter((_, i) => i !== index),
																	);
																}}
															>
																×
															</Button>
														</Badge>
													))}
													<FormDescription>
														İzlemeden hariç tutulacak hizmetler
													</FormDescription>
												</div>
											</div>
										</FormControl>

										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.server.thresholds.cpu"
								render={({ field }) => (
									<FormItem>
										<FormLabel>CPU Eşik Değeri (%)</FormLabel>
										<FormControl>
											<NumberInput {...field} />
										</FormControl>
										<FormDescription>
											CPU kullanımı bu yüzdeyi aştığında uyar
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.server.thresholds.memory"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bellek Eşik Değeri (%)</FormLabel>
										<FormControl>
											<NumberInput {...field} />
										</FormControl>
										<FormDescription>
											Bellek kullanımı bu yüzdeyi aştığında uyar
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.server.token"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Metrik Anahtarı</FormLabel>
										<FormControl>
											<div className="flex gap-2">
												<div className="relative flex-1">
													<Input
														type={showToken ? "text" : "password"}
														placeholder="Metrik anahtarınızı girin"
														{...field}
													/>
													<Button
														type="button"
														variant="secondary"
														size="icon"
														className="absolute right-0 top-1/2 -translate-y-1/2"
														onClick={() => setShowToken(!showToken)}
														title={showToken ? "Anahtarı gizle" : "Anahtarı göster"}
													>
														{showToken ? (
															<EyeOff className="h-4 w-4" />
														) : (
															<Eye className="h-4 w-4" />
														)}
													</Button>
												</div>
												<Button
													type="button"
													variant="outline"
													size="icon"
													onClick={() => {
														const newToken = generateToken();
														form.setValue(
															"metricsConfig.server.token",
															newToken,
														);
														toast.success("Anahtar başarıyla oluşturuldu");
													}}
													title="Yeni anahtar oluştur"
												>
													<RefreshCw className="h-4 w-4" />
												</Button>
											</div>
										</FormControl>
										<FormDescription>
											Metrik isteklerini doğrulamak için anahtar
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="metricsConfig.server.urlCallback"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Metrik Geri Çağırma URL'si</FormLabel>
										<FormControl>
											<Input
												placeholder="https://your-callback-url.com"
												{...field}
											/>
										</FormControl>
										<FormDescription>
											Metriklerin gönderileceği URL
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<div className="flex items-center justify-end gap-2">
							<Button type="submit" isLoading={form.formState.isSubmitting}>
								Değişiklikleri Kaydet
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</>
	);
};
