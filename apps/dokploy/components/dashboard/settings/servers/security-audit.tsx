import { Loader2, LockKeyhole, RefreshCw } from "lucide-react";
import { useState } from "react";
import { AlertBlock } from "@/components/shared/alert-block";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { api } from "@/utils/api";
import { StatusRow } from "./gpu-support";

interface Props {
	serverId: string;
}

export const SecurityAudit = ({ serverId }: Props) => {
	const [isRefreshing, setIsRefreshing] = useState(false);
	const { data, refetch, error, isPending, isError } =
		api.server.security.useQuery(
			{ serverId },
			{
				enabled: !!serverId,
			},
		);

	return (
		<CardContent className="p-0">
			<div className="flex flex-col gap-4">
				<Card className="bg-background">
					<CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
						<div className="flex flex-row gap-2 justify-between w-full  max-sm:flex-col">
							<div className="flex flex-col gap-1">
								<div className="flex items-center gap-2">
									<LockKeyhole className="size-5" />
									<CardTitle className="text-xl">
										Güvenlik Önerileri Kurulumu
									</CardTitle>
								</div>
								<CardDescription>
									Güvenlik önerilerini kontrol edin
								</CardDescription>
							</div>
							<Button
								isLoading={isRefreshing}
								onClick={async () => {
									setIsRefreshing(true);
									await refetch();
									setIsRefreshing(false);
								}}
							>
								<RefreshCw className="size-4" />
								Yenile
							</Button>
						</div>
						<div className="flex items-center gap-2 w-full">
							{isError && (
								<AlertBlock type="error" className="w-full">
									{error.message}
								</AlertBlock>
							)}
						</div>
					</CardHeader>

					<CardContent className="flex flex-col gap-4">
						<AlertBlock type="info" className="w-full">
							Ubuntu/Debian işletim sistemi desteği şu anda desteklenmektedir (Deneysel)
						</AlertBlock>
						{isPending ? (
							<div className="flex items-center justify-center text-muted-foreground py-4">
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								<span>Sunucu yapılandırması kontrol ediliyor</span>
							</div>
						) : (
							<div className="grid w-full gap-4">
								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">UFW</h3>
									<p className="text-sm text-muted-foreground mb-4">
										UFW (Karmaşık Olmayan Güvenlik Duvarı) sunucunuzdan gelen ve
										giden trafiği engellemek için kullanılabilecek basit bir
										güvenlik duvarıdır.
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label="UFW Kurulu"
											isEnabled={data?.ufw?.installed}
											description={
												data?.ufw?.installed
													? "Kurulu (Önerilen)"
													: "Kurulu Değil (Güvenlik için UFW kurulmalıdır)"
											}
										/>
										<StatusRow
											label="Durum"
											isEnabled={data?.ufw?.active}
											description={
												data?.ufw?.active
													? "Aktif (Önerilen)"
													: "Aktif Değil (Güvenlik için UFW etkinleştirilmelidir)"
											}
										/>
										<StatusRow
											label="Varsayılan Gelen"
											isEnabled={data?.ufw?.defaultIncoming === "deny"}
											description={
												data?.ufw?.defaultIncoming === "deny"
													? "Varsayılan: Reddet (Önerilen)"
													: `Varsayılan: ${data?.ufw?.defaultIncoming} (Güvenlik için 'deny' olarak ayarlanmalıdır)`
											}
										/>
									</div>
								</div>

								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">SSH</h3>
									<p className="text-sm text-muted-foreground mb-4">
										SSH (Güvenli Kabuk) bir sunucuya güvenli bir şekilde bağlanmanızı
										ve üzerinde komut çalıştırmanızı sağlayan bir protokoldür.
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label="Etkin"
											isEnabled={data?.ssh?.enabled}
											description={
												data?.ssh?.enabled
													? "Etkin"
													: "Etkin Değil (SSH etkinleştirilmelidir)"
											}
										/>
										<StatusRow
											label="Anahtar Doğrulama"
											isEnabled={data?.ssh?.keyAuth}
											description={
												data?.ssh?.keyAuth
													? "Etkin (Önerilen)"
													: "Etkin Değil (Anahtar Doğrulama etkinleştirilmelidir)"
											}
										/>
										<StatusRow
											label="Parola Doğrulama"
											isEnabled={data?.ssh?.passwordAuth === "no"}
											description={
												data?.ssh?.passwordAuth === "no"
													? "Devre Dışı (Önerilen)"
													: "Etkin (Parola Doğrulama devre dışı bırakılmalıdır)"
											}
										/>
										<StatusRow
											label="PAM Kullan"
											isEnabled={data?.ssh?.usePam === "no"}
											description={
												data?.ssh?.usePam === "no"
													? "Devre Dışı (Anahtar tabanlı doğrulama için önerilir)"
													: "Etkin (Anahtar tabanlı doğrulama kullanılırken devre dışı bırakılmalıdır)"
											}
										/>
									</div>
								</div>

								<div className="border rounded-lg p-4">
									<h3 className="text-lg font-semibold mb-1">Fail2Ban</h3>
									<p className="text-sm text-muted-foreground mb-4">
										Fail2Ban sunucunuza yapılan kaba kuvvet saldırılarını
										önlemek için kullanılabilecek bir hizmettir.
									</p>
									<div className="grid gap-2.5">
										<StatusRow
											label="Kurulu"
											isEnabled={data?.fail2ban?.installed}
											description={
												data?.fail2ban?.installed
													? "Kurulu (Önerilen)"
													: "Kurulu Değil (Kaba kuvvet saldırılarına karşı koruma için Fail2Ban kurulmalıdır)"
											}
										/>

										<StatusRow
											label="Etkin"
											isEnabled={data?.fail2ban?.enabled}
											description={
												data?.fail2ban?.enabled
													? "Etkin (Önerilen)"
													: "Etkin Değil (Fail2Ban hizmeti etkinleştirilmelidir)"
											}
										/>
										<StatusRow
											label="Aktif"
											isEnabled={data?.fail2ban?.active}
											description={
												data?.fail2ban?.active
													? "Aktif (Önerilen)"
													: "Aktif Değil (Fail2Ban hizmeti çalışıyor olmalıdır)"
											}
										/>

										<StatusRow
											label="SSH Koruması"
											isEnabled={data?.fail2ban?.sshEnabled === "true"}
											description={
												data?.fail2ban?.sshEnabled === "true"
													? "Etkin (Önerilen)"
													: "Etkin Değil (Kaba kuvvet saldırılarını önlemek için SSH koruması etkinleştirilmelidir)"
											}
										/>

										<StatusRow
											label="SSH Modu"
											isEnabled={data?.fail2ban?.sshMode === "aggressive"}
											description={
												data?.fail2ban?.sshMode === "aggressive"
													? "Agresif Mod (Önerilen)"
													: `Mod: ${data?.fail2ban?.sshMode || "Ayarlanmamış"} (Daha iyi koruma için agresif mod önerilir)`
											}
										/>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</CardContent>
	);
};
