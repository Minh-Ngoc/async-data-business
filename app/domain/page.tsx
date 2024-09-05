"use client";

import { title } from "@/components/primitives";
import domains from "@/constants/domains.json";
import { Button } from "@nextui-org/button";
import { useMemo } from "react";

function removeAccents(str: string) {
	return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const statusDomain = [
	{ value: "web-train", label: "Web đào tạo" },
	{ value: "satellite", label: "Vệ tinh" },
	{ value: "pause", label: "Tạm ngưng" },
	{ value: "seo", label: "SEO" },
	{ value: "pbn", label: "PBN" },
	{ value: "do-not-use", label: "Không sử dụng" },
	{ value: "301", label: "301" },
	{ value: "for-assistant", label: "Cho trợ lý" },
	{ value: "brand", label: "Hậu đài" },
	{ value: "back-up", label: "Backup" },
	{ value: "cdn", label: "CDN" },
];

function statusKpi(status: number | string) {
	if (Number(status) === 1) return "approved";
	if (Number(status) === -1) return "rejected";

	return "pending";
}

export default function PricingPage() {
	const newDomains: any = useMemo(() => {
		return domains?.map((domain: any) => {
			const {
				name,
				status,
				userManager,
				userSupport,
				expiresDate,
				note,
				disableKPI,
				kpi,
				...rest
			} = domain;

			const field: any = {
				keywords: [],
			};

			if (status) {
				field["statusDomain"] = statusDomain?.find(
					(item: any) =>
						removeAccents(item?.label)
							.toLowerCase()
							.replace(/\s+/g, "-") ===
						removeAccents(status).toLowerCase().replace(/\s+/g, "-")
				);
			}

			if (userManager?.length) {
				field["userManager"] = {
					$oid: userManager[0],
				};
			}

			if (userSupport?.length) {
				field["userSupport"] = {
					$oid: userSupport[0],
				};
			}

			if (expiresDate) {
				field["dateOut"] = expiresDate;
			}

			if (kpi?.length) {
				field["arrayKpi"] = kpi?.map((item: any) => {
					if (item?.details[0]?.keyword) {
						field.keywords.push(item?.details[0]?.keyword.trim());
					}

					return {
						_id: item?._id,
						keyword: item?.details[0]?.keyword || null,
						condition: {
							volume: item?.details[0]?.volumn,
							top: item?.details[0]?.result,
							customer: 0,
						},
						
						kpiReview:
							item?.details[0]?.kpi ||
							// item?.details[0]?.review ||
							null,
						dateReceive: item?.receiveDate,
						user: item?.user,
						month: item?.startDate,
						review: {
							status: statusKpi(item?.details[0]?.review),
						},
					};
				});
			}

			const keywords = new Set(field.keywords);

			delete rest.kpi;
			delete rest.transfer;

			return {
				...rest,
				...field,
				isCalculateKpi: disableKPI === true ? true : false,
				keywords: [...keywords],
				domainName: name,
				statusDomain: field?.statusDomain?.value || "",
				userManager: field?.userManager || null,
				userSupport: field?.userSupport || null,
				dateOut: field?.dateOut,
				arrayKpi: field["arrayKpi"],
			};
		});
	}, []);

	const exportData = () => {
		// Bước 1: Chuyển đổi trạng thái người dùng thành chuỗi JSON
		const domainJson = JSON.stringify(newDomains, null, 2);

		// Bước 2: Tạo một đối tượng Blob từ chuỗi JSON
		const blob = new Blob([domainJson], { type: "application/json" });

		// Bước 3: Tạo một liên kết tạm thời để tải xuống tệp Blob dưới dạng tệp JSON
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "domain.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	};

	return (
		<div>
			<div className={title()}>
				<h1>Export Domains Data</h1>

				<div className="">
					<Button onPress={exportData}>Export</Button>
				</div>
			</div>
		</div>
	);
}
