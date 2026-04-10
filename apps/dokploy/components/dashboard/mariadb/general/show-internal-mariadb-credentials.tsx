import { ToggleVisibilityInput } from "@/components/shared/toggle-visibility-input";
import { UpdateDatabasePassword } from "@/components/shared/update-database-password";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/utils/api";
import { toast } from "sonner";

interface Props {
	mariadbId: string;
}
export const ShowInternalMariadbCredentials = ({ mariadbId }: Props) => {
	const { data } = api.mariadb.one.useQuery({ mariadbId });
	const utils = api.useUtils();
	const { mutateAsync: changePassword } =
		api.mariadb.changePassword.useMutation();
	return (
		<>
			<div className="flex w-full flex-col gap-5 ">
				<Card className="bg-background">
					<CardHeader>
						<CardTitle className="text-xl">Dahili Kimlik Bilgileri</CardTitle>
					</CardHeader>
					<CardContent className="flex w-full flex-row gap-4">
						<div className="grid w-full md:grid-cols-2 gap-4 md:gap-8">
							<div className="flex flex-col gap-2">
								<Label>Kullanıcı</Label>
								<Input disabled value={data?.databaseUser} />
							</div>
							<div className="flex flex-col gap-2">
								<Label>Veritabanı Adı</Label>
								<Input disabled value={data?.databaseName} />
							</div>
							<div className="flex flex-col gap-2">
								<Label>Şifre</Label>
								<div className="flex flex-row gap-2 items-center">
									<ToggleVisibilityInput
										disabled
										value={data?.databasePassword}
									/>
									<UpdateDatabasePassword
										onUpdatePassword={async (newPassword) => {
											await changePassword({
												mariadbId,
												password: newPassword,
												type: "user",
											});
											toast.success("Şifre başarıyla güncellendi");
											utils.mariadb.one.invalidate({ mariadbId });
										}}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label>Root Şifresi</Label>
								<div className="flex flex-row gap-2 items-center">
									<ToggleVisibilityInput
										disabled
										value={data?.databaseRootPassword}
									/>
									<UpdateDatabasePassword
										label="Root Şifresi"
										onUpdatePassword={async (newPassword) => {
											await changePassword({
												mariadbId,
												password: newPassword,
												type: "root",
											});
											toast.success("Root şifresi başarıyla güncellendi");
											utils.mariadb.one.invalidate({ mariadbId });
										}}
									/>
								</div>
							</div>
							<div className="flex flex-col gap-2">
								<Label>Dahili Port (Konteyner)</Label>
								<Input disabled value="3306" />
							</div>

							<div className="flex flex-col gap-2">
								<Label>Dahili Host</Label>
								<Input disabled value={data?.appName} />
							</div>

							<div className="flex flex-col gap-2 md:col-span-2">
								<Label>Dahili Bağlantı URL'si </Label>
								<ToggleVisibilityInput
									disabled
									value={`mariadb://${data?.databaseUser}:${data?.databasePassword}@${data?.appName}:3306/${data?.databaseName}`}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);
};
