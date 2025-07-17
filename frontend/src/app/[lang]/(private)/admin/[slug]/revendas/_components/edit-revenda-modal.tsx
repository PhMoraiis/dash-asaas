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
import { useDictionary } from "@/hooks/use-dictionary";

const editRevendaSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("E-mail inválido"),
});

type EditRevendaForm = z.infer<typeof editRevendaSchema>;

interface EditRevendaModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	revenda: {
		id: string;
		name: string;
		email: string;
	};
}

export function EditRevendaModal({
	open,
	onOpenChange,
	revenda,
}: EditRevendaModalProps) {
	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
		setValue,
	} = useForm<EditRevendaForm>({
		resolver: zodResolver(editRevendaSchema),
		defaultValues: {
			name: revenda?.name || "",
			email: revenda?.email || "",
		},
	});

	const dict = useDictionary();
	const queryClient = useQueryClient();
	const editMutation = useMutation({
		mutationFn: async (data: EditRevendaForm) => {
			const res = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/revendas/${revenda.id}`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err?.message || "Erro ao editar revenda.");
			}
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["revendas"] });
			toast.success(dict.editResellerModal.toastSuccess);
			onOpenChange(false);
			reset();
		},
		onError: () => {
			toast.error(dict.editResellerModal.toastError);
		},
	});

	useEffect(() => {
		if (revenda) {
			setValue("name", revenda.name);
			setValue("email", revenda.email);
		}
	}, [revenda, setValue]);

	function onSubmit(data: EditRevendaForm) {
		editMutation.mutate(data);
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{dict.editResellerModal.title}</DialogTitle>
					<DialogDescription>
						{dict.editResellerModal.description}
					</DialogDescription>
				</DialogHeader>
				<form
					className="flex flex-col gap-6 mt-2"
					onSubmit={handleSubmit(onSubmit)}
				>
					<div className="space-y-2">
						<Label htmlFor="name">{dict.common.name}</Label>
						<Input id="name" {...register("name")} />
						{errors.name && (
							<span className="text-red-500 text-xs">
								{errors.name.message}
							</span>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">E-mail</Label>
						<Input id="email" type="email" {...register("email")} />
						{errors.email && (
							<span className="text-red-500 text-xs">
								{errors.email.message}
							</span>
						)}
					</div>
					<DialogFooter>
						<DialogClose asChild>
							<Button type="button" variant="secondary">
								{dict.common.cancel}
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
									{dict.common.save}
								</div>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
