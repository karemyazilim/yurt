import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import {
	CheckIcon,
	ChevronsUpDown,
	DatabaseZap,
	Info,
	PenBoxIcon,
	PlusCircle,
	RefreshCw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { type Control, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { CodeEditor } from "@/components/shared/code-editor";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Dialog,
	DialogContent,
	DialogDescription,
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
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectItem,
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
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import type { CacheType } from "../domains/handle-domain";
import { getTimezoneLabel, TIMEZONES } from "./timezones";

export const commonCronExpressions = [
	{ label: "Her dakika", value: "* * * * *" },
	{ label: "Her saat", value: "0 * * * *" },
	{ label: "Her gün gece yarısı", value: "0 0 * * *" },
	{ label: "Her Pazar gece yarısı", value: "0 0 * * 0" },
	{ label: "Her ayın 1'inde gece yarısı", value: "0 0 1 * *" },
	{ label: "Her 15 dakikada", value: "*/15 * * * *" },
	{ label: "Her hafta içi gece yarısı", value: "0 0 * * 1-5" },
	{ label: "Özel", value: "custom" },
];

const formSchema = z
	.object({
		name: z.string().min(1, "Ad gereklidir"),
		cronExpression: z.string().min(1, "Cron ifadesi gereklidir"),
		shellType: z.enum(["bash", "sh"]).default("bash"),
		command: z.string(),
		enabled: z.boolean().default(true),
		serviceName: z.string(),
		scheduleType: z.enum([
			"application",
			"compose",
			"server",
			"dokploy-server",
		]),
		script: z.string(),
		timezone: z.string().optional(),
	})
	.superRefine((data, ctx) => {
		if (data.scheduleType === "compose" && !data.serviceName) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Servis adı gereklidir",
				path: ["serviceName"],
			});
		}

		if (
			(data.scheduleType === "dokploy-server" ||
				data.scheduleType === "server") &&
			!data.script
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Betik gereklidir",
				path: ["script"],
			});
		}

		if (
			(data.scheduleType === "application" ||
				data.scheduleType === "compose") &&
			!data.command
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Komut gereklidir",
				path: ["command"],
			});
		}
	});

interface Props {
	id?: string;
	scheduleId?: string;
	scheduleType?: "application" | "compose" | "server" | "dokploy-server";
}

export const ScheduleFormField = ({
	name,
	formControl,
}: {
	name: string;
	formControl: Control<any>;
}) => {
	const [selectedOption, setSelectedOption] = useState("");

	return (
		<FormField
			control={formControl}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel className="flex items-center gap-2">
						Zamanlama
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="w-4 h-4 text-muted-foreground cursor-help" />
								</TooltipTrigger>
								<TooltipContent>
									<p>Cron ifade formatı: dakika saat gün ay haftanın_günü</p>
									<p>Örnek: 0 0 * * * (her gün gece yarısı)</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</FormLabel>
					<div className="flex flex-col gap-2">
						<Select
							value={selectedOption}
							onValueChange={(value) => {
								setSelectedOption(value);
								field.onChange(value === "custom" ? "" : value);
							}}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Önceden tanımlı bir zamanlama seçin" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{commonCronExpressions.map((expr) => (
									<SelectItem key={expr.value} value={expr.value}>
										{expr.label}
										{expr.value !== "custom" && ` (${expr.value})`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="relative">
							<FormControl>
								<Input
									placeholder="Özel cron ifadesi (ör. 0 0 * * *)"
									{...field}
									onChange={(e) => {
										const value = e.target.value;
										const commonExpression = commonCronExpressions.find(
											(expression) => expression.value === value,
										);
										if (commonExpression) {
											setSelectedOption(commonExpression.value);
										} else {
											setSelectedOption("custom");
										}
										field.onChange(e);
									}}
								/>
							</FormControl>
						</div>
					</div>
					<FormDescription>
						Önceden tanımlı bir zamanlama seçin veya özel bir cron ifadesi girin
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export const HandleSchedules = ({ id, scheduleId, scheduleType }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const [cacheType, setCacheType] = useState<CacheType>("cache");
	const utils = api.useUtils();
	const form = useForm({
		resolver: standardSchemaResolver(formSchema),
		defaultValues: {
			name: "",
			cronExpression: "",
			shellType: "bash",
			command: "",
			enabled: true,
			serviceName: "",
			scheduleType: scheduleType || "application",
			script: "",
			timezone: undefined,
		},
	});

	const scheduleTypeForm = form.watch("scheduleType");

	const { data: schedule } = api.schedule.one.useQuery(
		{ scheduleId: scheduleId || "" },
		{ enabled: !!scheduleId },
	);

	const {
		data: services,
		isFetching: isLoadingServices,
		error: errorServices,
		refetch: refetchServices,
	} = api.compose.loadServices.useQuery(
		{
			composeId: id || "",
			type: cacheType,
		},
		{
			retry: false,
			refetchOnWindowFocus: false,
			enabled: !!id && scheduleType === "compose",
		},
	);

	useEffect(() => {
		if (scheduleId && schedule) {
			form.reset({
				name: schedule.name,
				cronExpression: schedule.cronExpression,
				shellType: schedule.shellType,
				command: schedule.command,
				enabled: schedule.enabled,
				serviceName: schedule.serviceName || "",
				scheduleType: schedule.scheduleType,
				script: schedule.script || "",
				timezone: schedule.timezone || undefined,
			});
		}
	}, [form, schedule, scheduleId]);

	const { mutateAsync, isPending } = scheduleId
		? api.schedule.update.useMutation()
		: api.schedule.create.useMutation();

	const onSubmit = async (values: z.output<typeof formSchema>) => {
		if (!id && !scheduleId) return;

		await mutateAsync({
			...values,
			scheduleId: scheduleId || "",
			...(scheduleType === "application" && {
				applicationId: id || "",
			}),
			...(scheduleType === "compose" && {
				composeId: id || "",
			}),
			...(scheduleType === "server" && {
				serverId: id || "",
			}),
			...(scheduleType === "dokploy-server" && {
				userId: id || "",
			}),
		})
			.then(() => {
				toast.success(
					`Zamanlama başarıyla ${scheduleId ? "güncellendi" : "oluşturuldu"}`,
				);
				utils.schedule.list.invalidate({
					id,
					scheduleType,
				});
				setIsOpen(false);
			})
			.catch((error) => {
				toast.error(
					error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu",
				);
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>
				{scheduleId ? (
					<Button
						variant="ghost"
						size="icon"
						className="group hover:bg-blue-500/10"
					>
						<PenBoxIcon className="size-3.5 text-primary group-hover:text-blue-500" />
					</Button>
				) : (
					<Button>
						<PlusCircle className="w-4 h-4 mr-2" />
						Zamanlama Ekle
					</Button>
				)}
			</DialogTrigger>
			<DialogContent
				className={cn(
					scheduleTypeForm === "dokploy-server" || scheduleTypeForm === "server"
						? "sm:max-w-2xl"
						: "sm:max-w-lg",
				)}
			>
				<DialogHeader>
					<DialogTitle>{scheduleId ? "Düzenle" : "Oluştur"}: Zamanlama</DialogTitle>
					<DialogDescription>
						Belirli bir zamanda veya aralıkta görev çalıştırmak için bir zamanlama
						{scheduleId ? " yönetin" : " oluşturun"}.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{scheduleTypeForm === "compose" && (
							<div className="flex flex-col w-full gap-4">
								{errorServices && (
									<AlertBlock
										type="warning"
										className="[overflow-wrap:anywhere]"
									>
										{errorServices?.message}
									</AlertBlock>
								)}
								<FormField
									control={form.control}
									name="serviceName"
									render={({ field }) => (
										<FormItem className="w-full">
											<FormLabel>Servis Adı</FormLabel>
											<div className="flex gap-2">
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value || ""}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Bir servis adı seçin" />
														</SelectTrigger>
													</FormControl>

													<SelectContent>
														{services?.map((service, index) => (
															<SelectItem
																value={service}
																key={`${service}-${index}`}
															>
																{service}
															</SelectItem>
														))}
														<SelectItem value="none" disabled>
															Boş
														</SelectItem>
													</SelectContent>
												</Select>
												<TooltipProvider delayDuration={0}>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="secondary"
																type="button"
																isLoading={isLoadingServices}
																onClick={() => {
																	if (cacheType === "fetch") {
																		refetchServices();
																	} else {
																		setCacheType("fetch");
																	}
																}}
															>
																<RefreshCw className="size-4 text-muted-foreground" />
															</Button>
														</TooltipTrigger>
														<TooltipContent
															side="left"
															sideOffset={5}
															className="max-w-[10rem]"
														>
															<p>
																Getir: Depoyu klonlayarak servisleri
																yükleyecektir
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
												<TooltipProvider delayDuration={0}>
													<Tooltip>
														<TooltipTrigger asChild>
															<Button
																variant="secondary"
																type="button"
																isLoading={isLoadingServices}
																onClick={() => {
																	if (cacheType === "cache") {
																		refetchServices();
																	} else {
																		setCacheType("cache");
																	}
																}}
															>
																<DatabaseZap className="size-4 text-muted-foreground" />
															</Button>
														</TooltipTrigger>
														<TooltipContent
															side="left"
															sideOffset={5}
															className="max-w-[10rem]"
														>
															<p>
																Önbellek: Bu compose'u daha önce dağıttıysanız,
																servisleri son dağıtımdan/depo getirmesinden
																okuyacaktır
															</p>
														</TooltipContent>
													</Tooltip>
												</TooltipProvider>
											</div>

											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						)}

						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										Görev Adı
									</FormLabel>
									<FormControl>
										<Input placeholder="Günlük Veritabanı Yedeklemesi" {...field} />
									</FormControl>
									<FormDescription>
										Zamanlanmış göreviniz için açıklayıcı bir ad
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<ScheduleFormField
							name="cronExpression"
							formControl={form.control}
						/>

						<FormField
							control={form.control}
							name="timezone"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										Saat Dilimi
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger asChild>
													<Info className="w-4 h-4 text-muted-foreground cursor-help" />
												</TooltipTrigger>
												<TooltipContent>
													<p>
														Zamanlama için bir saat dilimi seçin. Belirtilmezse
														UTC kullanılır.
													</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									</FormLabel>
									<Popover>
										<PopoverTrigger asChild>
											<FormControl>
												<Button
													variant="outline"
													className={cn(
														"w-full justify-between !bg-input",
														!field.value && "text-muted-foreground",
													)}
												>
													{getTimezoneLabel(field.value)}
													<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
												</Button>
											</FormControl>
										</PopoverTrigger>
										<PopoverContent className="w-[400px] p-0" align="start">
											<Command>
												<CommandInput
													placeholder="Saat dilimi ara..."
													className="h-9"
												/>
												<CommandList>
													<CommandEmpty>Saat dilimi bulunamadı.</CommandEmpty>
													<ScrollArea className="h-72">
														{Object.entries(TIMEZONES).map(
															([region, zones]) => (
																<CommandGroup key={region} heading={region}>
																	{zones.map((tz) => (
																		<CommandItem
																			key={tz.value}
																			value={`${region} ${tz.label} ${tz.value}`}
																			onSelect={() => {
																				field.onChange(tz.value);
																			}}
																		>
																			{tz.value}
																			<CheckIcon
																				className={cn(
																					"ml-auto h-4 w-4",
																					field.value === tz.value
																						? "opacity-100"
																						: "opacity-0",
																				)}
																			/>
																		</CommandItem>
																	))}
																</CommandGroup>
															),
														)}
													</ScrollArea>
												</CommandList>
											</Command>
										</PopoverContent>
									</Popover>
									<FormDescription>
										İsteğe bağlı: Zamanlama çalışma saati için bir saat dilimi seçin
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						{(scheduleTypeForm === "application" ||
							scheduleTypeForm === "compose") && (
							<>
								<FormField
									control={form.control}
									name="shellType"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												Kabuk Türü
											</FormLabel>
											<Select
												onValueChange={field.onChange}
												defaultValue={field.value}
											>
												<FormControl>
													<SelectTrigger>
														<SelectValue placeholder="Kabuk türü seçin" />
													</SelectTrigger>
												</FormControl>
												<SelectContent>
													<SelectItem value="bash">Bash</SelectItem>
													<SelectItem value="sh">Sh</SelectItem>
												</SelectContent>
											</Select>
											<FormDescription>
												Komutunuzu çalıştırmak için kabuğu seçin
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="command"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-2">
												Komut
											</FormLabel>
											<FormControl>
												<Input placeholder="npm run backup" {...field} />
											</FormControl>
											<FormDescription>
												Konteynerde çalıştırılacak komut
											</FormDescription>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}

						{(scheduleTypeForm === "dokploy-server" ||
							scheduleTypeForm === "server") && (
							<FormField
								control={form.control}
								name="script"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Betik</FormLabel>
										<FormControl>
											<FormControl>
												<CodeEditor
													language="shell"
													placeholder={`# This is a comment
echo "Hello, world!"
`}
													className="h-96 font-mono"
													{...field}
												/>
											</FormControl>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<FormField
							control={form.control}
							name="enabled"
							render={({ field }) => (
								<FormItem>
									<FormLabel className="flex items-center gap-2">
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
										Etkin
									</FormLabel>
								</FormItem>
							)}
						/>

						<Button type="submit" isLoading={isPending} className="w-full">
							{scheduleId ? "Güncelle" : "Oluştur"}: Zamanlama
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
