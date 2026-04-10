import DOMPurify from "dompurify";
import { GlobeIcon, Pencil, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/ui/dropzone";
import { Input } from "@/components/ui/input";
import { type BundledIcon, bundledIcons } from "@/lib/bundled-icons";
import { api } from "@/utils/api";

interface ShowIconSettingsProps {
	applicationId: string;
	icon?: string | null;
}

const svgToDataUrl = (icon: BundledIcon): string => {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#${icon.hex}"><path d="${icon.path}"/></svg>`;
	return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export const ShowIconSettings = ({
	applicationId,
	icon,
}: ShowIconSettingsProps) => {
	const [open, setOpen] = useState(false);
	const [iconSearchQuery, setIconSearchQuery] = useState("");
	const [iconsToShow, setIconsToShow] = useState(24);

	const filteredIcons = useMemo(() => {
		if (!iconSearchQuery) return bundledIcons;
		const q = iconSearchQuery.toLowerCase();
		return bundledIcons.filter(
			(i) =>
				i.title.toLowerCase().includes(q) || i.slug.toLowerCase().includes(q),
		);
	}, [iconSearchQuery]);

	const displayedIcons = filteredIcons.slice(0, iconsToShow);
	const hasMoreIcons = filteredIcons.length > iconsToShow;

	const utils = api.useUtils();
	const { mutateAsync: updateApplication } =
		api.application.update.useMutation();

	useEffect(() => {
		if (open) {
			setIconSearchQuery("");
			setIconsToShow(24);
		}
	}, [open]);

	const handleIconSelect = async (selectedIcon: BundledIcon) => {
		try {
			const dataUrl = svgToDataUrl(selectedIcon);
			await updateApplication({
				applicationId,
				icon: dataUrl,
			});
			toast.success("Simge başarıyla kaydedildi");
			await utils.application.one.invalidate({ applicationId });
			setOpen(false);
		} catch (_error) {
			toast.error("Simge kaydedilirken hata oluştu");
		}
	};

	const handleRemoveIcon = async () => {
		try {
			await updateApplication({
				applicationId,
				icon: null,
			});
			toast.success("Simge kaldırıldı");
			await utils.application.one.invalidate({ applicationId });
		} catch (_error) {
			toast.error("Simge kaldırılırken hata oluştu");
		}
	};

	const sanitizeSvg = (svgContent: string): string | null => {
		const clean = DOMPurify.sanitize(svgContent, {
			USE_PROFILES: { svg: true, svgFilters: true },
			ADD_TAGS: ["use"],
		});
		if (!clean) return null;
		return `data:image/svg+xml;base64,${btoa(clean)}`;
	};

	const handleFileUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return;
		const file = files[0];
		if (!file) return;

		const allowedTypes = [
			"image/jpeg",
			"image/jpg",
			"image/png",
			"image/svg+xml",
		];
		const fileExtension = file.name.split(".").pop()?.toLowerCase();
		const allowedExtensions = ["jpg", "jpeg", "png", "svg"];

		if (
			!allowedTypes.includes(file.type) &&
			!allowedExtensions.includes(fileExtension || "")
		) {
			toast.error("Yalnızca JPG, JPEG, PNG ve SVG dosyalarına izin verilir");
			return;
		}

		if (file.size > 2 * 1024 * 1024) {
			toast.error("Görsel boyutu 2MB'den küçük olmalıdır");
			return;
		}

		const isSvg = file.type === "image/svg+xml" || fileExtension === "svg";

		if (isSvg) {
			const text = await file.text();
			const sanitizedDataUrl = sanitizeSvg(text);
			if (!sanitizedDataUrl) {
				toast.error("Geçersiz SVG dosyası");
				return;
			}
			try {
				await updateApplication({
					applicationId,
					icon: sanitizedDataUrl,
				});
				toast.success("Simge kaydedildi!");
				await utils.application.one.invalidate({ applicationId });
				setOpen(false);
			} catch (_error) {
				toast.error("Simge kaydedilirken hata oluştu");
			}
			return;
		}

		const reader = new FileReader();
		reader.onload = async (event) => {
			const result = event.target?.result as string;
			try {
				await updateApplication({
					applicationId,
					icon: result,
				});
				toast.success("Simge kaydedildi!");
				await utils.application.one.invalidate({ applicationId });
				setOpen(false);
			} catch (_error) {
				toast.error("Simge kaydedilirken hata oluştu");
			}
		};
		reader.readAsDataURL(file);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<button
					type="button"
					className="relative group flex items-center justify-center"
				>
					{icon ? (
						// biome-ignore lint/performance/noImgElement: icon is data URL or base64
						<img
							src={icon}
							alt="Uygulama simgesi"
							className="h-8 w-8 object-contain"
						/>
					) : (
						<GlobeIcon className="h-6 w-6 text-muted-foreground" />
					)}
					<div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity">
						<Pencil className="h-3 w-3 text-white" />
					</div>
				</button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle className="flex items-center justify-between">
						Simgeyi Değiştir
						{icon && (
							<Button
								variant="ghost"
								size="sm"
								onClick={handleRemoveIcon}
								className="text-muted-foreground"
							>
								<X className="size-4 mr-1" />
								Simgeyi kaldır
							</Button>
						)}
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
						<Input
							placeholder="Simge ara (örn. react, vue, docker)..."
							value={iconSearchQuery}
							onChange={(e) => setIconSearchQuery(e.target.value)}
							className="pl-9"
						/>
					</div>

					<div className="max-h-[300px] overflow-y-auto border rounded-lg p-4">
						{displayedIcons.length === 0 ? (
							<div className="text-center py-8 text-sm text-muted-foreground">
								Simge bulunamadı
							</div>
						) : (
							<>
								<div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
									{displayedIcons.map((i) => (
										<button
											type="button"
											key={i.slug}
											onClick={() => handleIconSelect(i)}
											className="flex flex-col items-center gap-1.5 p-2 rounded-lg border hover:border-primary hover:bg-muted transition-colors group"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												className="size-7 group-hover:scale-110 transition-transform"
												fill={`#${i.hex}`}
											>
												<path d={i.path} />
											</svg>
											<span className="text-[10px] text-muted-foreground capitalize truncate w-full text-center">
												{i.title}
											</span>
										</button>
									))}
								</div>
								{hasMoreIcons && (
									<div className="flex justify-center mt-3">
										<Button
											variant="outline"
											size="sm"
											onClick={() => setIconsToShow((prev) => prev + 24)}
										>
											Daha Fazla Yükle ({filteredIcons.length - iconsToShow} kalan)
										</Button>
									</div>
								)}
							</>
						)}
					</div>

					<div className="relative pt-3 border-t">
						<p className="text-sm text-muted-foreground text-center mb-3">
							veya özel bir simge yükleyin
						</p>
						<Dropzone
							dropMessage="Bir simgeyi sürükleyip bırakın veya yüklemek için tıklayın"
							accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
							onChange={handleFileUpload}
							classNameWrapper="border-2 border-dashed border-border hover:border-primary bg-muted/30 hover:bg-muted/50 transition-all rounded-lg"
						/>
						<div className="mt-2 text-center text-xs text-muted-foreground">
							Desteklenen formatlar: JPG, JPEG, PNG, SVG (maks. 2MB)
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
