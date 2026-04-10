import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
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
import { api } from "@/utils/api";

const formSchema = z
	.object({
		rollbackActive: z.boolean(),
		rollbackRegistryId: z.string().optional(),
	})
	.superRefine((values, ctx) => {
		if (
			values.rollbackActive &&
			(!values.rollbackRegistryId || values.rollbackRegistryId === "none")
		) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["rollbackRegistryId"],
				message: "Geri almalar etkinleştirildiğinde kayıt defteri gereklidir",
			});
		}
	});

type FormValues = z.infer<typeof formSchema>;

interface Props {
	applicationId: string;
	children?: React.ReactNode;
}

export const ShowRollbackSettings = ({ applicationId, children }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const { data: application, refetch } = api.application.one.useQuery(
		{
			applicationId,
		},
		{
			enabled: !!applicationId,
		},
	);

	const { mutateAsync: updateApplication, isPending } =
		api.application.update.useMutation();

	const { data: registries } = api.registry.all.useQuery();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			rollbackActive: application?.rollbackActive ?? false,
			rollbackRegistryId: application?.rollbackRegistryId || "",
		},
	});

	useEffect(() => {
		if (application) {
			form.reset({
				rollbackActive: application.rollbackActive ?? false,
				rollbackRegistryId: application.rollbackRegistryId || "",
			});
		}
	}, [application, form]);

	const onSubmit = async (data: FormValues) => {
		await updateApplication({
			applicationId,
			rollbackActive: data.rollbackActive,
			rollbackRegistryId:
				data.rollbackRegistryId === "none" || !data.rollbackRegistryId
					? null
					: data.rollbackRegistryId,
		})
			.then(() => {
				toast.success("Geri alma ayarları güncellendi");
				setIsOpen(false);
				refetch();
			})
			.catch(() => {
				toast.error("Geri alma ayarları güncellenemedi");
			});
	};

	return (
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Geri Alma Ayarları</DialogTitle>
					<DialogDescription>
						Bu uygulama için geri almaların nasıl çalışacağını yapılandırın
					</DialogDescription>
					<AlertBlock>
						Geri almaların etkinleştirilmesi depolama kullanımını artırır. Bu
						seçenekle dikkatli olun. Önbelleği manuel olarak temizlemenin geri alma
						görüntülerini silebileceğini ve gelecekteki geri almalar için kullanılamaz
						hale getirebileceğini unutmayın.
					</AlertBlock>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						<FormField
							control={form.control}
							name="rollbackActive"
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
									<div className="space-y-0.5">
										<FormLabel className="text-base">
											Geri Almaları Etkinleştir
										</FormLabel>
										<FormDescription>
											Önceki dağıtımlara geri dönmeye izin ver
										</FormDescription>
									</div>
									<FormControl>
										<Switch
											checked={field.value}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
								</FormItem>
							)}
						/>

						{form.watch("rollbackActive") && (
							<FormField
								control={form.control}
								name="rollbackRegistryId"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Geri Alma Kayıt Defteri</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value || "none"}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Bir kayıt defteri seçin" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectGroup>
													<SelectItem value="none">
														<span className="flex items-center gap-2">
															<span>Hiçbiri</span>
														</span>
													</SelectItem>
													{registries?.map((registry) => (
														<SelectItem
															key={registry.registryId}
															value={registry.registryId}
														>
															{registry.registryName}
														</SelectItem>
													))}
													<SelectLabel>
														Kayıt Defterleri ({registries?.length || 0})
													</SelectLabel>
												</SelectGroup>
											</SelectContent>
										</Select>
										{!registries || registries.length === 0 ? (
											<FormDescription className="text-amber-600 dark:text-amber-500">
												Kullanılabilir kayıt defteri yok. Geri almaları etkinleştirmek
												için lütfen önce bir{" "}
												<Link
													href="/dashboard/settings/registry"
													className="underline font-medium hover:text-amber-700 dark:hover:text-amber-400"
												>
													kayıt defteri yapılandırın
												</Link>
												.
											</FormDescription>
										) : (
											<FormDescription>
												Geri alma görüntülerinin depolanacağı bir kayıt defteri seçin.
											</FormDescription>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						<Button type="submit" className="w-full" isLoading={isPending}>
							Ayarları Kaydet
						</Button>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
