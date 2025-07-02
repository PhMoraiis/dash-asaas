"use client";

import { RowActions } from "@/components/dashboard/RowActions";
import type { Row } from "@tanstack/react-table";
import type { Item } from "./page";

export function RevendaRowActions({
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
				`http://localhost:3333/api/admin/revendas/${id}/status`
			}
			deleteEndpoint={(id) =>
				`http://localhost:3333/api/admin/revendas/${id}/force`
			}
			isInactive={(item) => item.status === "Inativo"}
			actionLabels={{
				activate: "Reativar",
				deactivate: "Desativar",
				delete: "Excluir",
			}}
			dialogMessages={{
				activate: "Esta ação irá reativar a revenda.",
				deactivate: "Esta ação irá desativar a revenda permanentemente.",
				delete:
					"Esta ação é irreversível e excluirá a revenda permanentemente do sistema.",
			}}
			showDeleteWhenInactive={true}
		/>
	);
}
