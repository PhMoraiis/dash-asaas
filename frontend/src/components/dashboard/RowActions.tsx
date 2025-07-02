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
import { EllipsisIcon, CircleAlertIcon, AlertTriangleIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";

export type RowActionsProps<T> = {
	row: Row<T>;
	onEdit: (item: T) => void;
	refetch: () => void;
	// Endpoints para ativar/desativar e deletar
	statusEndpoint: (id: string) => string;
	deleteEndpoint: (id: string) => string;
	// Status atual e labels customizáveis
	isInactive: (item: T) => boolean;
	actionLabels?: {
		activate?: string;
		deactivate?: string;
		delete?: string;
	};
	dialogMessages?: {
		activate?: string;
		deactivate?: string;
		delete?: string;
	};
	// Permite esconder ação de deletar se não quiser exibir
	showDeleteWhenInactive?: boolean;
};

export function RowActions<T extends { id: string }>({
	row,
	onEdit,
	refetch,
	statusEndpoint,
	deleteEndpoint,
	isInactive,
	actionLabels,
	dialogMessages,
	showDeleteWhenInactive = true,
}: RowActionsProps<T>) {
	const [openDialog, setOpenDialog] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const item = row.original;
	const inactive = isInactive(item);
	const actionLabel = inactive
		? actionLabels?.activate || "Reativar"
		: actionLabels?.deactivate || "Desativar";
	const actionColor = inactive
		? "text-green-600 focus:text-green-600"
		: "text-destructive focus:text-destructive";

	const queryClient = useQueryClient();

	// Mutation para ativar/desativar
	const toggleActiveMutation = useMutation({
		mutationFn: async () => {
			const res = await fetchWithAuth(statusEndpoint(item.id), {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ active: inactive }),
			});
			if (!res.ok) throw new Error("Erro ao atualizar status.");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success(
				inactive
					? actionLabels?.activate || "Ativado com sucesso!"
					: actionLabels?.deactivate || "Desativado com sucesso!",
			);
			setOpenDialog(false);
			refetch();
		},
		onError: () => {
			toast.error("Erro ao atualizar status.");
		},
	});

	// Mutation para exclusão permanente
	const deleteMutation = useMutation({
		mutationFn: async () => {
			const res = await fetchWithAuth(deleteEndpoint(item.id), {
				method: "DELETE",
			});
			if (!res.ok) throw new Error("Erro ao excluir.");
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success(actionLabels?.delete || "Excluído permanentemente!");
			setOpenDeleteDialog(false);
			refetch();
		},
		onError: () => {
			toast.error("Erro ao excluir.");
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
							aria-label="Ações"
						>
							<EllipsisIcon size={16} aria-hidden="true" />
						</Button>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem onSelect={() => onEdit(item)}>
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
					{inactive && showDeleteWhenInactive && (
						<DropdownMenuItem
							className="text-destructive focus:text-destructive"
							onSelect={() => setOpenDeleteDialog(true)}
						>
							<span>{actionLabels?.delete || "Excluir"}</span>
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
								{inactive
									? dialogMessages?.activate || "Esta ação irá reativar o item."
									: dialogMessages?.deactivate ||
										"Esta ação irá desativar o item permanentemente."}
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
							<AlertDialogTitle>Excluir item?</AlertDialogTitle>
							<AlertDialogDescription>
								{dialogMessages?.delete ||
									"Esta ação é irreversível e excluirá permanentemente do sistema."}
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
								actionLabels?.delete || "Excluir"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
