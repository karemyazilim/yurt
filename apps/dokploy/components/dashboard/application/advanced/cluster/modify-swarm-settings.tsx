import { Settings } from "lucide-react";
import { useState } from "react";
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
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
	EndpointSpecForm,
	HealthCheckForm,
	LabelsForm,
	ModeForm,
	NetworkForm,
	PlacementForm,
	RestartPolicyForm,
	RollbackConfigForm,
	StopGracePeriodForm,
	UpdateConfigForm,
} from "./swarm-forms";

type MenuItem = {
	id: string;
	label: string;
	description: string;
	docDescription: string;
};

const menuItems: MenuItem[] = [
	{
		id: "health-check",
		label: "Sağlık Kontrolü",
		description: "Sağlık kontrolü ayarlarını yapılandır",
		docDescription:
			"Konteynerin sağlığını test etmek için HEALTHCHECK yapılandırın. Konteyner içinde bir komut çalıştırarak sağlıklı olup olmadığını belirler. Test, Aralık, Zaman Aşımı, Başlangıç Süresi ve Yeniden Deneme sayısı sağlık izlemeyi kontrol eder.",
	},
	{
		id: "restart-policy",
		label: "Yeniden Başlatma Politikası",
		description: "Yeniden başlatma politikasını yapılandır",
		docDescription:
			"Servisteki konteynerler için yeniden başlatma politikasını yapılandırın. Koşul (yok, hata durumunda, herhangi biri), Gecikme (yeniden başlatmalar arasında nanosaniye), Maksimum Deneme ve Pencere yeniden başlatma davranışını kontrol eder.",
	},
	{
		id: "placement",
		label: "Yerleşim",
		description: "Yerleşim kısıtlamalarını yapılandır",
		docDescription:
			"Servis görevlerinin hangi düğümlerde zamanlanabileceğini kontrol edin. Kısıtlamalar (node.id==xyz), Tercihler (spread.node.labels.zone), Maksimum Kopya Sayısı ve Platformlar görev yerleşim kurallarını belirler.",
	},
	{
		id: "update-config",
		label: "Güncelleme Yapılandırması",
		description: "Güncelleme stratejisini yapılandır",
		docDescription:
			"Servisin nasıl güncelleneceğini yapılandırın. Paralellik (aynı anda güncellenen görevler), Gecikme, Hata Eylemi (duraklat, devam et, geri al), İzleme, Maksimum Hata Oranı ve Sıra (önce durdur, önce başlat) güncellemeleri kontrol eder.",
	},
	{
		id: "rollback-config",
		label: "Geri Alma Yapılandırması",
		description: "Geri alma stratejisini yapılandır",
		docDescription:
			"Güncelleme hatası durumunda otomatik geri almayı yapılandırın. Güncelleme Yapılandırması ile aynı parametreleri kullanır: Paralellik, Gecikme, Hata Eylemi, İzleme, Maksimum Hata Oranı ve Sıra.",
	},
	{
		id: "mode",
		label: "Mod",
		description: "Servis modunu yapılandır",
		docDescription:
			"Servis modunu belirli sayıda görevle (Kopya Sayısı) 'Kopyalanmış' veya 'Global' (düğüm başına bir görev) olarak ayarlayın.",
	},
	{
		id: "network",
		label: "Ağ",
		description: "Ağ bağlantılarını yapılandır",
		docDescription:
			"Servisi bir veya daha fazla ağa bağlayın. Ağ adını (Hedef) ve servis keşfi için isteğe bağlı ağ takma adlarını belirtin.",
	},
	{
		id: "labels",
		label: "Etiketler",
		description: "Servis etiketlerini yapılandır",
		docDescription:
			"Etiketler kullanarak servislere meta veri ekleyin. Etiketler, servisleri düzenlemek ve filtrelemek için anahtar-değer çiftleridir (ör. com.example.foo=bar).",
	},
	{
		id: "stop-grace-period",
		label: "Durdurma Bekleme Süresi",
		description: "Durdurma bekleme süresini yapılandır",
		docDescription:
			"Bir konteyneri zorla sonlandırmadan önce bekleme süresi. Nanosaniye cinsinden belirtilir (ör. 10000000000 = 10 saniye). Konteynerlerin düzgün bir şekilde kapanmasını sağlar.",
	},
	{
		id: "endpoint-spec",
		label: "Uç Nokta Tanımı",
		description: "Uç nokta tanımını yapılandır",
		docDescription:
			"Servis keşfi için uç nokta modunu yapılandırın. 'vip' modu (sanal IP - varsayılan) tek bir sanal IP kullanır. 'dnsrr' modu (DNS round-robin) tüm görevler için DNS kayıtları döndürür.",
	},
];

const hasStopGracePeriodSwarm = (
	value: unknown,
): value is { stopGracePeriodSwarm: number | string | null } =>
	typeof value === "object" &&
	value !== null &&
	"stopGracePeriodSwarm" in value;

interface Props {
	id: string;
	type:
		| "application"
		| "libsql"
		| "mariadb"
		| "mongo"
		| "mysql"
		| "postgres"
		| "redis";
}

export const AddSwarmSettings = ({ id, type }: Props) => {
	const [activeMenu, setActiveMenu] = useState<string>("health-check");
	const [open, setOpen] = useState(false);
	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="secondary" className="cursor-pointer w-fit">
					<Settings className="size-4 text-muted-foreground" />
					Swarm Ayarları
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-6xl max-h-[85vh]">
				<DialogHeader>
					<DialogTitle>Swarm Ayarları</DialogTitle>
					<DialogDescription>
						Servisiniz için swarm ayarlarını yapılandırın.
					</DialogDescription>
				</DialogHeader>
				<div>
					<AlertBlock type="info">
						Yerleşim gibi ayarları değiştirmek, günlüklerin/izlemenin,
						yedeklemelerin ve diğer özelliklerin kullanılamaz olmasına neden olabilir.
					</AlertBlock>
				</div>

				<div className="flex gap-4 h-[60vh] py-4">
					{/* Left Column - Menu */}
					<div className="w-64 flex-shrink-0 border-r pr-4 overflow-y-auto">
						<nav className="space-y-1">
							<TooltipProvider>
								{menuItems.map((item) => (
									<Tooltip key={item.id}>
										<TooltipTrigger asChild>
											<button
												type="button"
												onClick={() => setActiveMenu(item.id)}
												className={cn(
													"w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
													activeMenu === item.id
														? "bg-primary text-primary-foreground"
														: "hover:bg-muted",
												)}
											>
												<div className="font-medium">{item.label}</div>
												<div className="text-xs opacity-80">
													{item.description}
												</div>
											</button>
										</TooltipTrigger>
										<TooltipContent side="right" className="max-w-xs">
											<p className="text-xs">{item.docDescription}</p>
										</TooltipContent>
									</Tooltip>
								))}
							</TooltipProvider>
						</nav>
					</div>

					{/* Right Column - Form */}
					<div className="flex-1 overflow-y-auto">
						{activeMenu === "health-check" && (
							<HealthCheckForm id={id} type={type} />
						)}
						{activeMenu === "restart-policy" && (
							<RestartPolicyForm id={id} type={type} />
						)}
						{activeMenu === "placement" && (
							<PlacementForm id={id} type={type} />
						)}
						{activeMenu === "update-config" && (
							<UpdateConfigForm id={id} type={type} />
						)}
						{activeMenu === "rollback-config" && (
							<RollbackConfigForm id={id} type={type} />
						)}
						{activeMenu === "mode" && <ModeForm id={id} type={type} />}
						{activeMenu === "network" && <NetworkForm id={id} type={type} />}
						{activeMenu === "labels" && <LabelsForm id={id} type={type} />}
						{activeMenu === "stop-grace-period" && (
							<StopGracePeriodForm id={id} type={type} />
						)}
						{activeMenu === "endpoint-spec" && (
							<EndpointSpecForm id={id} type={type} />
						)}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
