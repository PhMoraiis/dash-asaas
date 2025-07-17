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
import { useDictionary } from "@/hooks/use-dictionary";

export type RowActionsProps<T> = {
	row: Row<T>;
	onEdit: (item: T) => void;
	refetch: () => void;
	// Endpoints para ativar/desativar e deletar
	statusEndpoint: (id: string) => string;
	deleteEndpoint: (id: string) => string;
	// Status atual e labels customizáveis
	isInactive: (item: T) => boolean;
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
	showDeleteWhenInactive = true,
}: RowActionsProps<T>) {
	const dict = useDictionary();
	const [openDialog, setOpenDialog] = useState(false);
	const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
	const item = row.original;
	const inactive = isInactive(item);
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
					? dict.rowActions.toastActived
					: dict.rowActions.toastDeactivated,
			);
			setOpenDialog(false);
			refetch();
		},
		onError: () => {
			toast.error(dict.rowActions.toastError);
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
			toast.success(dict.rowActions.toastDeleted);
			setOpenDeleteDialog(false);
			refetch();
		},
		onError: () => {
			toast.error(dict.rowActions.toastError);
		},
	});

	const actionLabel = inactive ? dict.common.activate : dict.common.deactivate;

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<div className="flex justify-end">
						<Button
							size="icon"
							variant="ghost"
							className="shadow-none"
							aria-label={dict.common.actions}
						>
							<EllipsisIcon size={16} aria-hidden="true" />
						</Button>
					</div>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuGroup>
						<DropdownMenuItem onSelect={() => onEdit(item)}>
							<span>{dict.common.edit}</span>
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
							<span>{dict.common.delete}</span>
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
							<AlertDialogTitle>
								{dict.rowActions.confirmTitle}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{inactive
									? dict.rowActions.confirmActivate
									: dict.rowActions.confirmDeactivate}
							</AlertDialogDescription>
						</AlertDialogHeader>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
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
							<AlertDialogTitle>
								{dict.rowActions.confirmDeleteTitle}
							</AlertDialogTitle>
							<AlertDialogDescription>
								{dict.rowActions.confirmDelete}
							</AlertDialogDescription>
						</AlertDialogHeader>
					</div>
					<AlertDialogFooter>
						<AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteMutation.mutate()}
							disabled={deleteMutation.isPending}
						>
							{deleteMutation.isPending ? (
								<CircleNotchIcon size={22} className="animate-spin" />
							) : (
								dict.common.delete
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
