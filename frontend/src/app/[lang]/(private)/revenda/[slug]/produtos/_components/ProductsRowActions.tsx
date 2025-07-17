"use client";

import { RowActions } from "@/components/dashboard/RowActions";
import type { Row } from "@tanstack/react-table";
import type { Item } from "../page";

export function ProductsRowActions({
	row,
	onEdit,
	refetch,
}: {
	row: Row<Item>;
	onEdit: (revenda: Item) => void;
	refetch: () => void;
}) {
	return (
		<RowActions
			row={row}
			onEdit={onEdit}
			refetch={refetch}
			statusEndpoint={(id) =>
				`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/status`
			}
			deleteEndpoint={(id) =>
				`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}/force`
			}
			isInactive={(item) => item.active === false}
			showDeleteWhenInactive={true}
		/>
	);
}
