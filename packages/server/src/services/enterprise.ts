import type { AuditAction, AuditResourceType } from "@dokploy/server/db/schema";

// Yurt, Dokploy'un DSAL lisanslı kurumsal özelliklerini (denetim kaydı, SSO,
// beyaz etiket, özel roller) içermez. Bu fonksiyonlar, çağrıldıkları yerlerin
// lisanssız Dokploy ile aynı davranmasını sağlar.

export const hasValidLicense = async (_organizationId: string) => false;

export interface CreateAuditLogInput {
	organizationId: string;
	userId: string;
	userEmail: string;
	userRole: string;
	action: AuditAction;
	resourceType: AuditResourceType;
	resourceId?: string;
	resourceName?: string;
	metadata?: Record<string, unknown>;
}

export const createAuditLog = async (_input: CreateAuditLogInput) => {};
