import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { Code2, Globe2, HardDrive } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { AlertBlock } from "@/components/shared/alert-block";
import { CodeEditor } from "@/components/shared/code-editor";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/utils/api";

const ImportSchema = z.object({
	base64: z.string(),
});

type ImportType = z.infer<typeof ImportSchema>;

interface Props {
	composeId: string;
}

export const ShowImport = ({ composeId }: Props) => {
	const [showModal, setShowModal] = useState(false);
	const [showMountContent, setShowMountContent] = useState(false);
	const [selectedMount, setSelectedMount] = useState<{
		filePath: string;
		content: string;
	} | null>(null);
	const [templateInfo, setTemplateInfo] = useState<{
		compose: string;
		template: {
			domains: Array<{
				serviceName: string;
				port: number;
				path?: string;
				host?: string;
			}>;
			envs: string[];
			mounts: Array<{
				filePath: string;
				content: string;
			}>;
		};
	} | null>(null);

	const utils = api.useUtils();
	const { mutateAsync: processTemplate, isPending: isLoadingTemplate } =
		api.compose.processTemplate.useMutation();
	const {
		mutateAsync: importTemplate,
		isPending: isImporting,
		isSuccess: isImportSuccess,
	} = api.compose.import.useMutation();

	const form = useForm<ImportType>({
		defaultValues: {
			base64: "",
		},
		resolver: zodResolver(ImportSchema),
	});

	useEffect(() => {
		form.reset({
			base64: "",
		});
	}, [isImportSuccess]);

	const onSubmit = async () => {
		const base64 = form.getValues("base64");
		if (!base64) {
			toast.error("Lütfen bir base64 şablonu girin");
			return;
		}

		try {
			await importTemplate({
				composeId,
				base64,
			});
			toast.success("Şablon başarıyla içe aktarıldı");
			await utils.compose.one.invalidate({
				composeId,
			});
			setShowModal(false);
		} catch {
			toast.error("Şablon içe aktarılırken hata oluştu");
		}
	};

	const handleLoadTemplate = async () => {
		const base64 = form.getValues("base64");
		if (!base64) {
			toast.error("Lütfen bir base64 şablonu girin");
			return;
		}

		try {
			const result = await processTemplate({
				composeId,
				base64,
			});
			setTemplateInfo(result);
			setShowModal(true);
		} catch {
			toast.error("Şablon işlenirken hata oluştu");
		}
	};

	const handleShowMountContent = (mount: {
		filePath: string;
		content: string;
	}) => {
		setSelectedMount(mount);
		setShowMountContent(true);
	};

	return (
		<>
			<Card className="bg-background">
				<CardHeader>
					<CardTitle className="text-xl">İçe Aktar</CardTitle>
					<CardDescription>Şablon yapılandırmanızı içe aktarın</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<AlertBlock type="warning">
						Uyarı: Bir şablonu içe aktarmak, bu servisteki tüm mevcut ortam
						değişkenlerini, bağlama noktalarını ve alan adlarını kaldıracaktır.
					</AlertBlock>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="grid w-full gap-4"
						>
							<FormField
								control={form.control}
								name="base64"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Yapılandırma (Base64)</FormLabel>
										<FormControl>
											<Textarea
												placeholder="Base64 yapılandırmanızı buraya girin..."
												className="font-mono min-h-[200px]"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex justify-end gap-2">
								<Button
									type="button"
									className="w-fit"
									variant="outline"
									isLoading={isLoadingTemplate}
									onClick={handleLoadTemplate}
								>
									Yükle
								</Button>
							</div>
							<Dialog open={showModal} onOpenChange={setShowModal}>
								<DialogContent className="max-w-[50vw]">
									<DialogHeader>
										<DialogTitle className="text-2xl font-bold">
											Şablon Bilgileri
										</DialogTitle>
										<DialogDescription className="space-y-2">
											<p>İçe aktarmadan önce şablon bilgilerini gözden geçirin</p>
											<AlertBlock type="warning">
												Uyarı: Bu işlem, bu servisteki tüm mevcut ortam
												değişkenlerini, bağlama noktalarını ve alan adlarını kaldıracaktır.
											</AlertBlock>
										</DialogDescription>
									</DialogHeader>

									<div className="flex flex-col gap-6">
										<div className="space-y-4">
											<div className="flex items-center gap-2">
												<Code2 className="h-5 w-5 text-primary" />
												<h3 className="text-lg font-semibold">
													Docker Compose
												</h3>
											</div>
											<CodeEditor
												language="yaml"
												value={templateInfo?.compose || ""}
												className="font-mono"
												readOnly
											/>
										</div>

										<Separator />

										{templateInfo?.template.domains &&
											templateInfo.template.domains.length > 0 && (
												<div className="space-y-4">
													<div className="flex items-center gap-2">
														<Globe2 className="h-5 w-5 text-primary" />
														<h3 className="text-lg font-semibold">Alan Adları</h3>
													</div>
													<div className="grid grid-cols-1 gap-3">
														{templateInfo.template.domains.map(
															(domain, index) => (
																<div
																	key={index}
																	className="rounded-lg border bg-card p-3 text-card-foreground shadow-sm"
																>
																	<div className="font-medium">
																		{domain.serviceName}
																	</div>
																	<div className="text-sm text-muted-foreground space-y-1">
																		<div>Port: {domain.port}</div>
																		{domain.host && (
																			<div>Sunucu: {domain.host}</div>
																		)}
																		{domain.path && (
																			<div>Yol: {domain.path}</div>
																		)}
																	</div>
																</div>
															),
														)}
													</div>
												</div>
											)}

										{templateInfo?.template.envs &&
											templateInfo.template.envs.length > 0 && (
												<div className="space-y-4">
													<div className="flex items-center gap-2">
														<Code2 className="h-5 w-5 text-primary" />
														<h3 className="text-lg font-semibold">
															Ortam Değişkenleri
														</h3>
													</div>
													<div className="grid grid-cols-1 gap-2">
														{templateInfo.template.envs.map((env, index) => (
															<div
																key={index}
																className="rounded-lg truncate border bg-card p-2 font-mono text-sm"
															>
																{env}
															</div>
														))}
													</div>
												</div>
											)}

										{templateInfo?.template.mounts &&
											templateInfo.template.mounts.length > 0 && (
												<div className="space-y-4">
													<div className="flex items-center gap-2">
														<HardDrive className="h-5 w-5 text-primary" />
														<h3 className="text-lg font-semibold">Bağlama Noktaları</h3>
													</div>
													<div className="grid grid-cols-1 gap-2">
														{templateInfo.template.mounts.map(
															(mount, index) => (
																<div
																	key={index}
																	className="rounded-lg border bg-card p-2 font-mono text-sm hover:bg-accent cursor-pointer transition-colors"
																	onClick={() => handleShowMountContent(mount)}
																>
																	{mount.filePath}
																</div>
															),
														)}
													</div>
												</div>
											)}
									</div>

									<div className="flex justify-end gap-2 pt-4">
										<Button
											variant="outline"
											onClick={() => setShowModal(false)}
										>
											İptal
										</Button>
										<Button
											isLoading={isImporting}
											type="submit"
											onClick={form.handleSubmit(onSubmit)}
											className="w-fit"
										>
											İçe Aktar
										</Button>
									</div>
								</DialogContent>
							</Dialog>
						</form>
					</Form>
				</CardContent>
			</Card>

			<Dialog open={showMountContent} onOpenChange={setShowMountContent}>
				<DialogContent className="max-w-[50vw]">
					<DialogHeader>
						<DialogTitle className="text-xl font-bold">
							{selectedMount?.filePath}
						</DialogTitle>
						<DialogDescription>Bağlama Dosyası İçeriği</DialogDescription>
					</DialogHeader>

					<ScrollArea className="h-[45vh] pr-4">
						<CodeEditor
							language="yaml"
							value={selectedMount?.content || ""}
							className="font-mono"
							readOnly
						/>
					</ScrollArea>

					<div className="flex justify-end gap-2 pt-4">
						<Button onClick={() => setShowMountContent(false)}>Kapat</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};
