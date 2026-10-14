import type { whitelabelingConfigSchema } from "@dokploy/server/db/schema";
import type { z } from "zod";

type WhitelabelingConfig = z.infer<typeof whitelabelingConfigSchema>;

// Beyaz etiket Dokploy kurumsal (DSAL) özelliğidir ve Yurt'ta yoktur.
// Sayfalar her zaman varsayılan Yurt görünümünü kullanır.

/** Oturum açılmış sayfalar için beyaz etiket ayarı (Yurt'ta her zaman yok). */
export function useWhitelabeling() {
	return { config: null as WhitelabelingConfig | null };
}

/** Oturum açılmamış sayfalar için beyaz etiket ayarı (Yurt'ta her zaman yok). */
export function useWhitelabelingPublic() {
	return { config: null as WhitelabelingConfig | null };
}
