import {
	AlertCircle,
	AlertTriangle,
	ExternalLink,
	Info,
	RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ContainerInfo } from "./types";

export const DocLinks = () => (
	<div className="flex flex-col gap-1 pt-2 border-t mt-2">
		<p className="text-xs font-medium text-muted-foreground">
			Faydalı kaynaklar:
		</p>
		<div className="flex flex-wrap gap-x-4 gap-y-1">
			<a
				href="https://docs.dokploy.com/docs/core"
				target="_blank"
				rel="noopener noreferrer"
				className="text-xs text-primary underline underline-offset-4 inline-flex items-center gap-1"
			>
				Dokploy Dokümantasyonu
				<ExternalLink className="h-3 w-3" />
			</a>
			<a
				href="https://docs.docker.com/engine/swarm/"
				target="_blank"
				rel="noopener noreferrer"
				className="text-xs text-primary underline underline-offset-4 inline-flex items-center gap-1"
			>
				Docker Swarm Kılavuzu
				<ExternalLink className="h-3 w-3" />
			</a>
			<Link
				href="/dashboard/settings/cluster"
				className="text-xs text-primary underline underline-offset-4 inline-flex items-center gap-1"
			>
				Küme Ayarları
			</Link>
		</div>
	</div>
);

interface SwarmNotAvailableProps {
	errorMessage?: string;
	onRetry: () => void;
}

export const SwarmNotAvailable = ({
	errorMessage,
	onRetry,
}: SwarmNotAvailableProps) => (
	<div className="flex flex-col gap-4 py-6 max-w-2xl mx-auto">
		<Alert variant="destructive">
			<AlertTriangle className="h-4 w-4" />
			<AlertTitle>Swarm Kullanılamıyor</AlertTitle>
			<AlertDescription>
				Docker Swarm'a ulaşılamadı.{" "}
				{errorMessage && (
					<span className="block mt-1 text-xs opacity-80">{errorMessage}</span>
				)}
			</AlertDescription>
		</Alert>
		<div className="space-y-3 text-sm text-muted-foreground">
			<p>
				Bu özellik Docker Swarm'ın başlatılmış ve aktif olmasını gerektirir. Başlamak için:
			</p>
			<ol className="list-decimal list-inside space-y-2 ml-1">
				<li>
					Sunucunuzda Swarm'ı başlatın:{" "}
					<code className="bg-muted px-1.5 py-0.5 rounded text-xs">
						docker swarm init
					</code>
				</li>
				<li>
					Aktif olduğunu doğrulayın:{" "}
					<code className="bg-muted px-1.5 py-0.5 rounded text-xs">
						docker info | grep Swarm
					</code>
				</li>
				<li>
					Swarm düğümlerinizi yönetmek için{" "}
					<Link
						href="/dashboard/settings/cluster"
						className="text-primary underline underline-offset-4"
					>
						Küme Ayarları
					</Link>{" "}
					sayfasını kontrol edin
				</li>
			</ol>
			<DocLinks />
		</div>
		<Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
			<RefreshCw className="h-4 w-4 mr-2" />
			Tekrar Dene
		</Button>
	</div>
);

interface ServicesErrorProps {
	errorMessage?: string;
	onRetry: () => void;
}

export const ServicesError = ({
	errorMessage,
	onRetry,
}: ServicesErrorProps) => (
	<div className="flex flex-col gap-4 py-6 max-w-2xl mx-auto">
		<Alert variant="destructive">
			<AlertTriangle className="h-4 w-4" />
			<AlertTitle>Servisler Yüklenemedi</AlertTitle>
			<AlertDescription>
				Swarm erişilebilir ancak servis listeleme başarısız oldu.{" "}
				{errorMessage && (
					<span className="block mt-1 text-xs opacity-80">{errorMessage}</span>
				)}
			</AlertDescription>
		</Alert>
		<div className="space-y-3 text-sm text-muted-foreground">
			<p>Bunun nedeni şunlar olabilir:</p>
			<ul className="list-disc list-inside space-y-1 ml-1">
				<li>Sunucuda Docker komutlarını çalıştırma izin sorunları</li>
				<li>Docker daemon yanıt vermiyor</li>
				<li>
					Uzak sunucuya ağ bağlantı sorunları &mdash;{" "}
					<Link
						href="/dashboard/settings/cluster"
						className="text-primary underline underline-offset-4"
					>
						Küme Ayarları
					</Link>
					{" "}sayfasını kontrol edin
				</li>
			</ul>
		</div>
		<Button variant="outline" size="sm" className="w-fit" onClick={onRetry}>
			<RefreshCw className="h-4 w-4 mr-2" />
			Tekrar Dene
		</Button>
	</div>
);

interface NoServicesProps {
	nodeCount: number;
	onRefresh: () => void;
}

export const NoServices = ({ nodeCount, onRefresh }: NoServicesProps) => (
	<div className="flex flex-col gap-4 py-6 max-w-2xl mx-auto">
		<Alert>
			<Info className="h-4 w-4" />
			<AlertTitle>Swarm Servisi Bulunamadı</AlertTitle>
			<AlertDescription>
				Docker Swarm <strong>{nodeCount} düğüm</strong> ile aktif, ancak
				swarm'da çalışan uygulama servisi bulunmuyor.
			</AlertDescription>
		</Alert>
		<div className="space-y-3 text-sm text-muted-foreground">
			<p>
				Bu görünüm <strong>Swarm servisleri</strong> olarak dağıtılan konteynerleri gösterir.
				Bağımsız veya Docker Compose konteynerleri burada görünmez.
			</p>
			<p>Bu görünümde konteynerleri görmek için uygulamalarınızın şu şekilde olduğundan emin olun:</p>
			<ol className="list-decimal list-inside space-y-2 ml-1">
				<li>
					<strong>Swarm servisleri olarak dağıtılmış</strong> &mdash; Dokploy'daki uygulamalar varsayılan olarak Swarm'a dağıtılır. Docker Compose projelerinin Swarm servisleri olarak çalışması için{" "}
					<code className="bg-muted px-1.5 py-0.5 rounded text-xs">Stack</code>{" "}
					türünü kullanması gerekir ({" "}
					<code className="bg-muted px-1.5 py-0.5 rounded text-xs">
						Docker Compose
					</code>
					{" "}değil).
				</li>
				<li>
					<strong>Bir registry kullanıyor</strong> (çoklu düğüm kurulumları için) &mdash;
					Worker düğümlerinin paylaşılan bir registry'den imaj çekmesi gerekir.{" "}
					<Link
						href="/dashboard/settings/cluster"
						className="text-primary underline underline-offset-4"
					>
						Küme Ayarları
					</Link>
					'ndan bir tane yapılandırın.
				</li>
				<li>
					<strong>Başarıyla derlenmiş ve dağıtılmış</strong> &mdash; Hatalar için projenizin dağıtım günlüklerini kontrol edin.
				</li>
			</ol>
			<DocLinks />
		</div>
		<Button variant="outline" size="sm" className="w-fit" onClick={onRefresh}>
			<RefreshCw className="h-4 w-4 mr-2" />
			Yenile
		</Button>
	</div>
);

interface NoRunningContainersProps {
	serviceCount: number;
	containers: ContainerInfo[];
	onRefresh: () => void;
}

export const NoRunningContainers = ({
	serviceCount,
	containers,
	onRefresh,
}: NoRunningContainersProps) => {
	const hasErrors = containers.some((c) => c.Error && c.Error.trim() !== "");
	return (
		<div className="flex flex-col gap-4 py-6 max-w-2xl mx-auto">
			<Alert>
				<AlertTriangle className="h-4 w-4" />
				<AlertTitle>Çalışan Konteyner Yok</AlertTitle>
				<AlertDescription>
					Swarm'da <strong>{serviceCount} servis</strong> bulundu, ancak
					hiçbirinde çalışan konteyner yok.
				</AlertDescription>
			</Alert>
			{hasErrors && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertTitle>Konteyner Hataları Tespit Edildi</AlertTitle>
					<AlertDescription>
						<ul className="list-disc list-inside space-y-1 mt-1">
							{containers
								.filter((c) => c.Error && c.Error.trim() !== "")
								.slice(0, 5)
								.map((c) => (
									<li key={c.ID} className="text-xs">
										<strong>{c.Name}</strong>: {c.Error}
									</li>
								))}
						</ul>
					</AlertDescription>
				</Alert>
			)}
			<div className="space-y-3 text-sm text-muted-foreground">
				<p>Bu durum şu hallerde oluşabilir:</p>
				<ul className="list-disc list-inside space-y-2 ml-1">
					<li>Servisler 0 replikaya ölçeklendirilmiş</li>
					<li>
						Konteynerler başlatılamıyor &mdash; hatalar için dağıtım günlüklerini kontrol edin
					</li>
					<li>
						Worker düğümlerinde imajlar çekilemiyor &mdash;{" "}
						<Link
							href="/dashboard/settings/cluster"
							className="text-primary underline underline-offset-4"
						>
							registry yapılandırmanızı
						</Link>
						{" "}doğrulayın
					</li>
					<li>
						Düğüm kısıtlamaları zamanlamayı engelliyor &mdash; uygulamanızın Küme ayarlarındaki yerleşim kurallarını kontrol edin
					</li>
				</ul>
				<DocLinks />
			</div>
			<Button variant="outline" size="sm" className="w-fit" onClick={onRefresh}>
				<RefreshCw className="h-4 w-4 mr-2" />
				Refresh
			</Button>
		</div>
	);
};
