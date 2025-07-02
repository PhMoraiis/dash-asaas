"use client";

import { RowActions } from "@/components/dashboard/RowActions";
import type { Row } from "@tanstack/react-table";
import type { Item } from "./page";

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
			statusEndpoint={(id) => `http://localhost:3333/api/products/${id}/status`}
			deleteEndpoint={(id) => `http://localhost:3333/api/products/${id}/force`}
			isInactive={(item) => item.active === false}
			actionLabels={{
				activate: "Reativar",
				deactivate: "Desativar",
				delete: "Excluir",
			}}
			dialogMessages={{
				activate: "Esta ação irá reativar o produto.",
				deactivate: "Esta ação irá desativar o produto permanentemente.",
				delete:
					"Esta ação é irreversível e excluirá o produto permanentemente do sistema.",
			}}
			showDeleteWhenInactive={true}
		/>
	);
}
