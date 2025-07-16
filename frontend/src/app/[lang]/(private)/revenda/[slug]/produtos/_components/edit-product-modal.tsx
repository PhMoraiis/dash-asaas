import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	CircleNotchIcon,
	PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const editProductSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	description: z.string().optional(),
});

type EditProductForm = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	product: {
		id: string;
		name: string;
		description: string;
	};
}

export function EditProductModal({
	open,
	onOpenChange,
	product,
}: EditProductModalProps) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
	} = useForm<EditProductForm>({
		resolver: zodResolver(editProductSchema),
		defaultValues: {
			name: product?.name || "",
			description: product?.description || "",
		},
	});

	const queryClient = useQueryClient();
	const editMutation = useMutation({
		mutationFn: async (data: EditProductForm) => {
			const res = await fetchWithAuth(
				`http://localhost:3333/api/products/${product.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err?.message || "Erro ao editar produto.");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["products"] });
			toast.success("Produto editado com sucesso!");
			onOpenChange(false);
			reset();
		},
		// biome-ignore lint/suspicious/noExplicitAny: ignore
		onError: (error: any) => {
			toast.error(error?.message || "Erro ao editar produto.");
		},
	});

	useEffect(() => {
		if (product) {
			setValue("name", product.name);
			setValue("description", product.description);
		}
	}, [product, setValue]);

	function onSubmit(data: EditProductForm) {
		editMutation.mutate(data);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Editar Produto</DialogTitle>
					<DialogDescription>
						Altere os campos desejados e salve as alterações.
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6 mt-2"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div className="space-y-2">
						<Label htmlFor="name">Nome</Label>
						<Input id="name" {...register("name")} />
						{errors.name && (
							<span className="text-red-500 text-xs">
								{errors.name.message}
							</span>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Descrição</Label>
						<Input
							id="description"
							type="description"
							{...register("description")}
						/>
						{errors.description && (
							<span className="text-red-500 text-xs">
								{errors.description.message}
							</span>
						)}
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="secondary">
								Cancelar
							</Button>
						</DialogClose>
						<Button
							type="submit"
							className="w-full gap-4"
							disabled={editMutation.isPending}
						>
							{editMutation.isPending ? (
								<CircleNotchIcon size={22} className="animate-spin" />
							) : (
								<div className="flex items-center justify-center">
									<PencilSimpleIcon className="mr-2 h-4 w-4" />
									Salvar Alterações
								</div>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
