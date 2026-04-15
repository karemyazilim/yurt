import copy from "copy-to-clipboard";
import { CopyIcon, ExternalLinkIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/shared/code-editor";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { api } from "@/utils/api";

export const CreateSSHKey = () => {
	const { data, refetch } = api.sshKey.all.useQuery();
	const generateMutation = api.sshKey.generate.useMutation();
	const { mutateAsync, isPending } = api.sshKey.create.useMutation();
	const hasCreatedKey = useRef(false);
	const [selectedOption, setSelectedOption] = useState<"manual" | "provider">(
		"manual",
	);

	const cloudSSHKey = data?.find(
		(sshKey) => sshKey.name === "dokploy-cloud-ssh-key",
	);

	useEffect(() => {
		const createKey = async () => {
			if (!data || cloudSSHKey || hasCreatedKey.current || isPending) {
				return;
			}

			hasCreatedKey.current = true;

			try {
				const keys = await generateMutation.mutateAsync({
					type: "rsa",
				});
				await mutateAsync({
					name: "dokploy-cloud-ssh-key",
					description: "Yurt Cloud'da kullanılır",
					privateKey: keys.privateKey,
					publicKey: keys.publicKey,
					organizationId: "",
				});
				await refetch();
			} catch (error) {
				console.error("Error creating SSH key:", error);
				hasCreatedKey.current = false;
			}
		};

		createKey();
	}, [data]);

	return (
		<Card className="h-full bg-transparent">
			<CardContent>
				<div className="grid w-full gap-4 pt-4">
					{isPending || !cloudSSHKey ? (
						<div className="min-h-[25vh] justify-center flex items-center gap-4">
							<Loader2
								className="animate-spin text-muted-foreground"
								size={32}
							/>
						</div>
					) : (
						<>
							<div className="flex flex-col gap-4 text-sm text-muted-foreground">
								<p className="text-primary text-base font-semibold">
									SSH Anahtarlarını sunucunuza nasıl ekleyeceğinizi seçin:
								</p>

								{/* Radio button options */}
								<div className="grid gap-2">
									<RadioGroup
										value={selectedOption}
										onValueChange={(value) => {
											setSelectedOption(value as "manual" | "provider");
										}}
										className="grid gap-3"
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="manual" id="manual" />
											<Label
												htmlFor="manual"
												className="text-primary font-medium cursor-pointer"
											>
												SSH Anahtarını Sunucuya Manuel Olarak Ekle
											</Label>
										</div>

										<div className="flex items-center space-x-2">
											<RadioGroupItem value="provider" id="provider" />
											<Label
												htmlFor="provider"
												className="text-primary font-medium cursor-pointer"
											>
												Sağlayıcınızda sunucu oluştururken SSH Anahtarı ekleyin
											</Label>
										</div>
									</RadioGroup>
								</div>

								{/* Content based on selected option */}
								{selectedOption === "manual" && (
									<div className="flex flex-col gap-2 w-full border rounded-lg p-4">
										<span className="text-base font-semibold text-primary">
											Manuel Kurulum Talimatları
										</span>
										<ul className="space-y-2">
											<li className="items-center flex gap-1">
												1. Sunucunuza giriş yapın
											</li>
											<li>
												2. Giriş yaptıktan sonra aşağıdaki komutu çalıştırın
												<div className="flex relative flex-col gap-4 w-full mt-2">
													<CodeEditor
														lineWrapping
														language="properties"
														value={`echo "${cloudSSHKey?.publicKey}" >> ~/.ssh/authorized_keys`}
														readOnly
														className="font-mono opacity-60"
													/>
													<button
														type="button"
														className="absolute right-2 top-2"
														onClick={() => {
															copy(
																`echo "${cloudSSHKey?.publicKey}" >> ~/.ssh/authorized_keys`,
															);
															toast.success("Panoya kopyalandı");
														}}
													>
														<CopyIcon className="size-4" />
													</button>
												</div>
											</li>
											<li className="mt-1">
												3. Tamamlandı, sunucunuzun bilgilerini girmek için bir sonraki adımı takip edin.
											</li>
										</ul>
									</div>
								)}

								{selectedOption === "provider" && (
									<div className="flex flex-col gap-2 w-full border rounded-lg p-4">
										<span className="text-base font-semibold text-primary">
											Sağlayıcı Kurulum Talimatları
										</span>
										<div className="flex flex-col gap-4 w-full overflow-auto">
											<div className="flex relative flex-col gap-2 overflow-y-auto">
												<div className="text-sm text-primary flex flex-row gap-2 items-center">
													Genel Anahtarı Kopyala
													<button
														type="button"
														className="right-2 top-8"
														onClick={() => {
															copy(
																cloudSSHKey?.publicKey || "SSH Anahtarı Oluştur",
															);
															toast.success("SSH panoya kopyalandı");
														}}
													>
														<CopyIcon className="size-4 text-muted-foreground" />
													</button>
												</div>
											</div>
										</div>
										<p className="text-sm mt-2">
											Tercih ettiğiniz sağlayıcıda (Hostinger, Digital Ocean, Hetzner vb.) sunucu oluştururken bu genel anahtarı kullanın
										</p>
										<Link
											href="https://docs.dokploy.com/docs/core/remote-servers/instructions#requirements"
											target="_blank"
											className="text-primary flex flex-row gap-2 mt-2"
										>
											Öğreticiyi Görüntüle <ExternalLinkIcon className="size-4" />
										</Link>
									</div>
								)}
							</div>
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
};
