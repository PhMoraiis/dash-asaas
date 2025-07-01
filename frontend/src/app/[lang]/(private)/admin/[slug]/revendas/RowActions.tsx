"use client";

import {
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogCancel,
	AlertDialogAction,
	AlertDialog,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenu,
} from "@/components/ui/dropdown-menu";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import type { Row } from "@tanstack/react-table";
import {
	EllipsisIcon,
	CircleAlertIcon,
	AlertTriangleIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Item } from "./page";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";

export const RowActions = ({
	row,
	onEdit,
	refetch,
}: {
	row: Row<Item>;
	onEdit: (revenda: Item) => void;
	refetch: () => void;
}) => {
	const [openDialog, setOpenDialog] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const revendaId = row.original.id;
	const isInactive = row.original.status === "Inativo";
	const actionLabel = isInactive ? "Reativar" : "Desativar";
	const actionColor = isInactive
		? "text-green-600 focus:text-green-600"
		: "text-destructive focus:text-destructive";

	const queryClient = useQueryClient();

	// Mutation para ativar/desativar
	const toggleActiveMutation = useMutation({
		mutationFn: async () => {
			const res = await fetchWithAuth(
				`http://localhost:3333/api/admin/revendas/${revendaId}/status`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ active: isInactive }),
				},
			);
			if (!res.ok) throw new Error("Erro ao atualizar revenda.");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["revendas"] });
			toast.success(
				isInactive
					? "Revenda ativada com sucesso!"
					: "Revenda desativada com sucesso!",
			);
			setOpenDialog(false);
		},
		onError: () => {
			toast.error("Erro ao atualizar revenda.");
		},
	});

	// Mutation para exclusão permanente
	const deleteMutation = useMutation({
		mutationFn: async () => {
			const res = await fetchWithAuth(
				`http://localhost:3333/api/admin/revendas/${revendaId}/force`,
				{
					method: "DELETE",
				},
			);
			if (!res.ok) throw new Error("Erro ao excluir revenda.");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["revendas"] });
			toast.success("Revenda excluída permanentemente!");
			setOpenDeleteDialog(false);
		},
		onError: () => {
			toast.error("Erro ao excluir revenda.");
		},
	});

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div className="flex justify-end">
						<Button
							size="icon"
							variant="ghost"
							className="shadow-none"
							aria-label="Editar revenda"
						>
							<EllipsisIcon size={16} aria-hidden="true" />
						</Button>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem onSelect={() => onEdit(row.original)}>
							<span>Editar</span>
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className={actionColor}
						onSelect={() => setOpenDialog(true)}
					>
						<span>{actionLabel}</span>
					</DropdownMenuItem>
					{isInactive && (
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onSelect={() => setOpenDeleteDialog(true)}
						>
							<span>Excluir</span>
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>
			{/* Dialog de ativar/desativar */}
			<AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
				<AlertDialogContent>
					<div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
						<div
							className="flex size-9 shrink-0 items-center justify-center rounded-full border"
							aria-hidden="true"
						>
							<CircleAlertIcon className="opacity-80" size={16} />
						</div>
						<AlertDialogHeader>
							<AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
							<AlertDialogDescription>
								{isInactive
									? "Esta ação irá reativar a revenda."
									: "Esta ação irá desativar a revenda permanentemente."}
							</AlertDialogDescription>
						</AlertDialogHeader>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => toggleActiveMutation.mutate()}
							disabled={toggleActiveMutation.isPending}
						>
							{toggleActiveMutation.isPending ? (
								<CircleNotchIcon size={22} className="animate-spin" />
							) : (
								actionLabel
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			{/* Dialog de exclusão permanente */}
			<AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
				<AlertDialogContent>
					<div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
						<div
							className="flex size-9 shrink-0 items-center justify-center rounded-full border"
							aria-hidden="true"
						>
							<AlertTriangleIcon
								className="text-primary opacity-80"
								size={16}
							/>
						</div>
						<AlertDialogHeader>
							<AlertDialogTitle>Excluir revenda?</AlertDialogTitle>
							<AlertDialogDescription>
								Esta ação é irreversível e excluirá a revenda permanentemente do
								sistema.
							</AlertDialogDescription>
						</AlertDialogHeader>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate()}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<CircleNotchIcon size={22} className="animate-spin" />
							) : (
								"Excluir"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
};
