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
	PlusIcon,
	CopyIcon,
	CheckIcon,
} from "@phosphor-icons/react/dist/ssr";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useDictionary } from "@/hooks/use-dictionary";

const createAdminSchema = z.object({
	name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
	email: z.string().email("E-mail inválido"),
});

type CreateAdminForm = z.infer<typeof createAdminSchema>;

interface CreateAdminModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateAdminModal({
	open,
	onOpenChange,
}: CreateAdminModalProps) {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
		reset,
	} = useForm<CreateAdminForm>({
		resolver: zodResolver(createAdminSchema),
	});

	const queryClient = useQueryClient();
	const [showPasswordModal, setShowPasswordModal] = useState(false);
	const [generatedPassword, setGeneratedPassword] = useState<string | null>(
		null,
	);
	const [copySuccess, setCopySuccess] = useState(false);
	const dict = useDictionary();

	const createMutation = useMutation({
		mutationFn: async (data: CreateAdminForm) => {
			const res = await fetchWithAuth(
				`${process.env.NEXT_PUBLIC_API_URL}/api/admin/adm`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(data),
				},
			);
			if (!res.ok) {
				const err = await res.json();
				throw new Error(err?.message || "Erro ao criar administrador.");
			}
			return res.json();
		},
		onSuccess: (data) => {
			toast.success(dict.createAdminModal.toastSuccess);
			queryClient.invalidateQueries({ queryKey: ["admins"] });
			onOpenChange(false);
			reset();
			if (data.password) {
				setGeneratedPassword(data.password);
				setShowPasswordModal(true);
			}
		},
		// biome-ignore lint/suspicious/noExplicitAny: ignore
		onError: (error: any) => {
			if (error?.message?.includes("já existe")) {
				toast.error(dict.createAdminModal.toastExists);
			} else {
				toast.error(dict.createAdminModal.toastError);
			}
		},
	});

	function onSubmit(data: CreateAdminForm) {
		createMutation.mutate(data);
	}

	function handleCopyPassword() {
		if (generatedPassword) {
			navigator.clipboard.writeText(generatedPassword);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 1500);
		}
	}

	return (
		<>
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{dict.createAdminModal.title}</DialogTitle>
						<DialogDescription>
							{dict.createAdminModal.description}
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
						<div className="space-y-2 mb-4">
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
								disabled={isSubmitting}
							>
								{isSubmitting ? (
									<CircleNotchIcon size={22} className="animate-spin" />
								) : (
									<div className="flex items-center justify-center">
										<PlusIcon className="mr-2 h-4 w-4" />
										{dict.createAdminModal.buttonAdd}
									</div>
								)}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			{/* Modal para exibir a senha gerada */}
			<AlertDialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{dict.createAdminModal.passwordGenerated}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{dict.createAdminModal.descriptionPassword}
							<br />
							<br />
							{dict.createAdminModal.observationPassword}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<div className="flex items-center justify-between gap-2 p-2 border rounded bg-muted font-mono select-all">
						<span>{generatedPassword}</span>
						{copySuccess ? (
							<Button size="icon" variant="outline" type="button">
								<CheckIcon className="text-green-600" size={18} />
							</Button>
						) : (
							<Button
								size="icon"
								variant="outline"
								onClick={handleCopyPassword}
								type="button"
							>
								<CopyIcon size={18} />
							</Button>
						)}
					</div>
					<AlertDialogFooter>
						<AlertDialogAction onClick={() => setShowPasswordModal(false)}>
							{dict.common.close}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
