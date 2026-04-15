import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Preview,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";

export type TemplateProps = {
	projectName: string;
	applicationName: string;
	volumeName: string;
	serviceType:
		| "application"
		| "postgres"
		| "mysql"
		| "mongodb"
		| "mariadb"
		| "redis"
		| "compose"
		| "libsql";
	type: "error" | "success";
	errorMessage?: string;
	backupSize?: string;
	date: string;
};

export const VolumeBackupEmail = ({
	projectName = "dokploy",
	applicationName = "frontend",
	volumeName = "app-data",
	serviceType = "application",
	type = "success",
	errorMessage,
	backupSize,
	date = "2023-05-01T00:00:00.000Z",
}: TemplateProps) => {
	const previewText = `${applicationName} birim yedeklemesi ${type === "success" ? "başarılı ✅" : "başarısız ❌"}`;
	return (
		<Html>
			<Preview>{previewText}</Preview>
			<Tailwind
				config={{
					theme: {
						extend: {
							colors: {
								brand: "#007291",
							},
						},
					},
				}}
			>
				<Head />

				<Body className="bg-white my-auto mx-auto font-sans px-2">
					<Container className="border border-solid border-[#eaeaea] rounded-lg my-[40px] mx-auto p-[20px] max-w-[465px]">
						<Section className="mt-[32px]">
							<Img
								src={
									"https://raw.githubusercontent.com/Dokploy/dokploy/refs/heads/canary/apps/dokploy/logo.png"
								}
								width="100"
								height="50"
								alt="Yurt"
								className="my-0 mx-auto"
							/>
						</Section>
						<Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
							<strong>{applicationName}</strong> birim yedeklemesi
						</Heading>
						<Text className="text-black text-[14px] leading-[24px]">
							Merhaba,
						</Text>
						<Text className="text-black text-[14px] leading-[24px]">
							<strong>{applicationName}</strong> birim yedeklemesi{" "}
							{type === "success"
								? "başarıyla tamamlandı ✅"
								: "başarısız oldu. Lütfen aşağıdaki hata mesajını kontrol edin. ❌"}
							.
						</Text>
						<Section className="flex text-black text-[14px]  leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
							<Text className="!leading-3 font-bold">Detaylar: </Text>
							<Text className="!leading-3">
								Proje Adı: <strong>{projectName}</strong>
							</Text>
							<Text className="!leading-3">
								Uygulama Adı: <strong>{applicationName}</strong>
							</Text>
							<Text className="!leading-3">
								Birim Adı: <strong>{volumeName}</strong>
							</Text>
							<Text className="!leading-3">
								Servis Türü: <strong>{serviceType}</strong>
							</Text>
							{backupSize && (
								<Text className="!leading-3">
									Yedek Boyutu: <strong>{backupSize}</strong>
								</Text>
							)}
							<Text className="!leading-3">
								Tarih: <strong>{date}</strong>
							</Text>
						</Section>
						{type === "error" && errorMessage ? (
							<Section className="flex text-black text-[14px]  mt-4 leading-[24px] bg-[#F4F4F5] rounded-lg p-2">
								<Text className="!leading-3 font-bold">Sebep: </Text>
								<Text className="text-[12px] leading-[24px]">
									{errorMessage || "Hata mesajı sağlanmadı"}
								</Text>
							</Section>
						) : null}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default VolumeBackupEmail;
