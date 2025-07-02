"use client";

import { RowActions } from "@/components/dashboard/RowActions";
import type { Row } from "@tanstack/react-table";
import type { Item } from "./page";

export function AdminRowActions({
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
				`http://localhost:3333/api/admin/adm/${id}/status`
			}
			deleteEndpoint={(id) => `http://localhost:3333/api/admin/adm/${id}/force`}
			isInactive={(item) => item.status === "Inativo"}
			actionLabels={{
				activate: "Reativar",
				deactivate: "Desativar",
				delete: "Excluir",
			}}
			dialogMessages={{
				activate: "Esta ação irá reativar o administrador.",
				deactivate: "Esta ação irá desativar o administrador permanentemente.",
				delete:
					"Esta ação é irreversível e excluirá o administrador permanentemente do sistema.",
			}}
			showDeleteWhenInactive={true}
		/>
	);
}
