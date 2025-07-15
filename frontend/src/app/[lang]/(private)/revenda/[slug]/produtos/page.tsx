"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { z } from "zod";
import { useId, useMemo, useRef } from "react";
import {
	flexRender,
	getCoreRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type VisibilityState,
	type SortingState,
	type PaginationState,
	type ColumnFiltersState,
	type FilterFn,
	type ColumnDef,
} from "@tanstack/react-table";
import {
	ChevronDownIcon,
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronUpIcon,
	CircleXIcon,
	Columns3Icon,
	FilterIcon,
	ListFilterIcon,
	PlusIcon,
	RefreshCwIcon,
	EyeIcon,
	EyeOffIcon,
	ClipboardIcon,
	CheckIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
} from "@/components/ui/pagination";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { ProductsRowActions } from "./_components/ProductsRowActions";
import { CreateProductModal } from "./_components/create-product-modal";
import { EditProductModal } from "./_components/edit-product-modal";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";
import { ProductDetailModal } from "./_components/product-detail-modal";

// Esquema do produto
const productSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	active: z.boolean(),
	createdAt: z.string(),
	updatedAt: z.string(),
	webhookToken: z.string(),
});

type Product = z.infer<typeof productSchema>;

export type Item = {
	id: string;
	name: string;
	description?: string;
	status: "Ativo" | "Inativo";
	active: boolean;
	webhookToken: string;
	createdAt: string;
	updatedAt: string;
};

// Custom filter function for multi-column searching
const multiColumnFilterFn: FilterFn<Item> = (row, _columnId, filterValue) => {
	const searchableRowContent =
		`${row.original.name} ${row.original.description}`.toLowerCase();
	const searchTerm = (filterValue ?? "").toLowerCase();
	return searchableRowContent.includes(searchTerm);
};

const statusFilterFn: FilterFn<Item> = (
	row,
	columnId,
	filterValue: string[],
) => {
	if (!filterValue?.length) return true;
	const status = row.getValue(columnId) as string;
	return filterValue.includes(status);
};

function TokenCell({ token }: { token?: string }) {
	const [show, setShow] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		if (!token) return;
		await navigator.clipboard.writeText(token);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	if (!token) {
		return <span className="text-xs text-muted-foreground">Nenhum</span>;
	}

	return (
		<div className="flex items-center">
			<span className="font-mono text-xs">
				{show ? token : `${token.slice(0, 4)}...`}
			</span>
			<Button size="icon" variant="ghost" onClick={() => setShow((v) => !v)}>
				{show ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
			</Button>
			<Button size="icon" variant="ghost" onClick={handleCopy}>
				{copied ? (
					<CheckIcon size={16} className="text-emerald-500" />
				) : (
					<ClipboardIcon size={16} />
				)}
			</Button>
		</div>
	);
}

export default function ProductsPage() {
	const [openCreateModal, setOpenCreateModal] = useState(false);
	const [openEditModal, setOpenEditModal] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [selectedProductId, setSelectedProductId] = useState<string | null>(
		null,
	);
	const [_showToken, _setShowTokenn] = useState(false);
	const [_copied, _setCopiedd] = useState(false);

	const id = useId();
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const inputRef = useRef<HTMLInputElement>(null);
	const [sorting, setSorting] = useState<SortingState>([
		{
			id: "name",
			desc: false,
		},
	]);
	const [_show, _setShoww] = useState(false);
	const [_setCopied] = useState(false);

	// Função para buscar produtos da revenda logada
	const fetchProducts = async () => {
		const res = await fetchWithAuth("http://localhost:3333/api/products");
		if (!res.ok) throw new Error("Erro ao buscar produtos");
		return res.json();
	};

	const {
		data: productsData,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["products"],
		queryFn: fetchProducts,
		staleTime: 1000 * 60, // 1 minuto
	});

	const data: Item[] = useMemo(
		() =>
			productsData?.map((p: Product) => ({
				id: p.id,
				name: p.name,
				description: p.description,
				active: p.active,
				status: p.active ? "Ativo" : "Inativo",
				webhookToken: p.webhookToken,
				createdAt: p.createdAt,
				updatedAt: p.updatedAt,
			})) || [],
		[productsData],
	);

	const columns: ColumnDef<Item>[] = [
		{
			header: "Nome",
			accessorKey: "name",
			cell: ({ row }) => (
				<div className="font-medium">{row.getValue("name")}</div>
			),
			size: 180,
			enableHiding: false,
		},
		{
			header: "Descrição",
			accessorKey: "description",
			size: 220,
			cell: ({ row }) => <span>{row.getValue("description") || "-"}</span>,
			filterFn: multiColumnFilterFn,
		},
		{
			header: "Webhook Token",
			accessorKey: "webhookToken",
			size: 200,
			cell: ({ row }) => <TokenCell token={row.original.webhookToken} />,
		},
		{
			header: "Status",
			accessorKey: "status",
			cell: ({ row }) => (
				<Badge
					className={cn(
						row.getValue("status") === "Inativo" &&
							"bg-muted-foreground/60 text-primary-foreground",
					)}
				>
					{row.getValue("status")}
				</Badge>
			),
			size: 100,
			filterFn: statusFilterFn,
		},
		{
			header: "Criado em",
			accessorKey: "createdAt",
			size: 140,
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground">
					{new Date(row.original.createdAt).toLocaleDateString("pt-BR", {
						day: "2-digit",
						month: "2-digit",
						year: "2-digit",
					})}
				</span>
			),
		},
		{
			header: "Detallhes",
			id: "details",
			cell: ({ row }) => (
				<Button
					variant="outline"
					size="sm"
					className="cursor-pointer flex items-center justify-center"
					onClick={() => handleOpenDetail(row.original.id)}
				>
					Ver mais <ArrowSquareOutIcon />
				</Button>
			),
			size: 100,
		},
		{
			id: "actions",
			header: () => <span className="sr-only">Ações</span>,
			cell: ({ row }) => (
				<ProductsRowActions
					row={row}
					onEdit={handleEditProduct}
					refetch={refetch}
				/>
			),
			size: 60,
			enableHiding: false,
		},
	];

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: getSortedRowModel(),
		onSortingChange: setSorting,
		enableSortingRemoval: false,
		getPaginationRowModel: getPaginationRowModel(),
		onPaginationChange: setPagination,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		state: {
			sorting,
			pagination,
			columnFilters,
			columnVisibility,
		},
	});

	// Get unique status values
	// biome-ignore lint/correctness/useExhaustiveDependencies: ignore
	const uniqueStatusValues = useMemo(() => {
		const statusColumn = table.getColumn("status");
		if (!statusColumn) return [];
		const values = Array.from(statusColumn.getFacetedUniqueValues().keys());
		return values.sort();
	}, [table.getColumn("status")?.getFacetedUniqueValues()]);

	// Get counts for each status
	// biome-ignore lint/correctness/useExhaustiveDependencies: ignore
	const statusCounts = useMemo(() => {
		const statusColumn = table.getColumn("status");
		if (!statusColumn) return new Map();
		return statusColumn.getFacetedUniqueValues();
	}, [table.getColumn("status")?.getFacetedUniqueValues()]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: ignore
	const selectedStatuses = useMemo(() => {
		const filterValue = table.getColumn("status")?.getFilterValue() as string[];
		return filterValue ?? [];
	}, [table.getColumn("status")?.getFilterValue()]);

	const handleStatusChange = (checked: boolean, value: string) => {
		const filterValue = table.getColumn("status")?.getFilterValue() as string[];
		const newFilterValue = filterValue ? [...filterValue] : [];

		if (checked) {
			newFilterValue.push(value);
		} else {
			const index = newFilterValue.indexOf(value);
			if (index > -1) {
				newFilterValue.splice(index, 1);
			}
		}

		table
			.getColumn("status")
			?.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
	};

	const handleEditProduct = (product: Item) => {
		const found = productsData?.find((r: Product) => r.id === product.id);
		if (found) {
			setSelectedProduct(found);
			setOpenEditModal(true);
		}
	};

	const handleOpenDetail = (productId: string) => {
		setSelectedProductId(productId);
		setOpenDetailModal(true);
	};

	// Função para ser passada para modais e ações que precisam atualizar a lista
	const handleAfterChange = () => {
		refetch();
	};

	return (
		<div className="space-y-4 px-6 py-4">
			{/* Filters */}
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					{/* Filter by name */}
					<div className="relative">
						<Input
							id={`${id}-input`}
							ref={inputRef}
							className={cn(
								"peer min-w-60 ps-9",
								Boolean(table.getColumn("name")?.getFilterValue()) && "pe-9",
							)}
							value={
								(table.getColumn("name")?.getFilterValue() ?? "") as string
							}
							onChange={(e) =>
								table.getColumn("name")?.setFilterValue(e.target.value)
							}
							placeholder="Filter by name..."
							type="text"
							aria-label="Filter by name"
						/>
						<div className="text-muted-foreground/80 pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 peer-disabled:opacity-50">
							<ListFilterIcon size={16} aria-hidden="true" />
						</div>
						{Boolean(table.getColumn("name")?.getFilterValue()) && (
							<button
								type="button"
								className="text-muted-foreground/80 hover:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md transition-[color,box-shadow] outline-none focus:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Clear filter"
								onClick={() => {
									table.getColumn("name")?.setFilterValue("");
									if (inputRef.current) {
										inputRef.current.focus();
									}
								}}
							>
								<CircleXIcon size={16} aria-hidden="true" />
							</button>
						)}
					</div>
					{/* Filter by status */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">
								<FilterIcon
									className="-ms-1 opacity-60"
									size={16}
									aria-hidden="true"
								/>
								Status
								{selectedStatuses.length > 0 && (
									<span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
										{selectedStatuses.length}
									</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto min-w-36 p-3" align="start">
							<div className="space-y-3">
								<div className="text-muted-foreground text-xs font-medium">
									Filters
								</div>
								<div className="space-y-3">
									{uniqueStatusValues.map((value, i) => (
										<div key={value} className="flex items-center gap-2">
											<Checkbox
												id={`${id}-${i}`}
												checked={selectedStatuses.includes(value)}
												onCheckedChange={(checked: boolean) =>
													handleStatusChange(checked, value)
												}
											/>
											<Label
												htmlFor={`${id}-${i}`}
												className="flex grow justify-between gap-2 font-normal"
											>
												{value}{" "}
												<span className="text-muted-foreground ms-2 text-xs">
													{statusCounts.get(value)}
												</span>
											</Label>
										</div>
									))}
								</div>
							</div>
						</PopoverContent>
					</Popover>
					{/* Toggle columns visibility */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline">
								<Columns3Icon
									className="-ms-1 opacity-60"
									size={16}
									aria-hidden="true"
								/>
								View
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
							{table
								.getAllColumns()
								.filter((column) => column.getCanHide())
								.map((column) => {
									return (
										<DropdownMenuCheckboxItem
											key={column.id}
											className="capitalize"
											checked={column.getIsVisible()}
											onCheckedChange={(value) =>
												column.toggleVisibility(!!value)
											}
											onSelect={(event) => event.preventDefault()}
										>
											{column.id}
										</DropdownMenuCheckboxItem>
									);
								})}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex items-center gap-3">
					{/* Add user button */}
					<Button
						variant="outline"
						size="icon"
						className="mr-2"
						onClick={() => refetch()}
						disabled={isLoading}
						aria-label="Recarregar lista"
					>
						<RefreshCwIcon
							size={18}
							className={isLoading ? "animate-spin" : ""}
						/>
					</Button>
					<Button
						className="ml-auto"
						variant="outline"
						onClick={() => setOpenCreateModal(true)}
					>
						<PlusIcon
							className="-ms-1 opacity-60"
							size={16}
							aria-hidden="true"
						/>
						Adicionar Produto
					</Button>
				</div>
			</div>

			{/* Table */}
			<div className="bg-background overflow-hidden rounded-md border">
				<Table className="table-fixed">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header) => {
									return (
										<TableHead
											key={header.id}
											style={{ width: `${header.getSize()}px` }}
											className="h-11"
										>
											{header.isPlaceholder ? null : header.column.getCanSort() ? (
												// biome-ignore lint/a11y/noStaticElementInteractions: ignore
												<div
													className={cn(
														header.column.getCanSort() &&
															"flex h-full cursor-pointer items-center justify-between gap-2 select-none",
													)}
													onClick={header.column.getToggleSortingHandler()}
													onKeyDown={(e) => {
														// Enhanced keyboard handling for sorting
														if (
															header.column.getCanSort() &&
															(e.key === "Enter" || e.key === " ")
														) {
															e.preventDefault();
															header.column.getToggleSortingHandler()?.(e);
														}
													}}
													tabIndex={header.column.getCanSort() ? 0 : undefined}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{{
														asc: (
															<ChevronUpIcon
																className="shrink-0 opacity-60"
																size={16}
																aria-hidden="true"
															/>
														),
														desc: (
															<ChevronDownIcon
																className="shrink-0 opacity-60"
																size={16}
																aria-hidden="true"
															/>
														),
													}[header.column.getIsSorted() as string] ?? null}
												</div>
											) : (
												flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)
											)}
										</TableHead>
									);
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={
										row.original.active === false
											? "opacity-50 grayscale pointer-events-auto"
											: ""
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell key={cell.id} className="last:py-0">
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									No results.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			<div className="flex items-center justify-between gap-8">
				{/* Results per page */}
				<div className="flex items-center gap-3">
					<Label htmlFor={id} className="max-sm:sr-only">
						Rows per page
					</Label>
					<Select
						value={table.getState().pagination.pageSize.toString()}
						onValueChange={(value) => {
							table.setPageSize(Number(value));
						}}
					>
						<SelectTrigger id={id} className="w-fit whitespace-nowrap">
							<SelectValue placeholder="Select number of results" />
						</SelectTrigger>
						<SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
							{[5, 10, 25, 50].map((pageSize) => (
								<SelectItem key={pageSize} value={pageSize.toString()}>
									{pageSize}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				{/* Page number information */}
				<div className="text-muted-foreground flex grow justify-end text-sm whitespace-nowrap">
					<p
						className="text-muted-foreground text-sm whitespace-nowrap"
						aria-live="polite"
					>
						<span className="text-foreground">
							{table.getState().pagination.pageIndex *
								table.getState().pagination.pageSize +
								1}
							-
							{Math.min(
								Math.max(
									table.getState().pagination.pageIndex *
										table.getState().pagination.pageSize +
										table.getState().pagination.pageSize,
									0,
								),
								table.getRowCount(),
							)}
						</span>{" "}
						of{" "}
						<span className="text-foreground">
							{table.getRowCount().toString()}
						</span>
					</p>
				</div>

				{/* Pagination buttons */}
				<div>
					<Pagination>
						<PaginationContent>
							{/* First page button */}
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									className="disabled:pointer-events-none disabled:opacity-50"
									onClick={() => table.firstPage()}
									disabled={!table.getCanPreviousPage()}
									aria-label="Go to first page"
								>
									<ChevronFirstIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
							{/* Previous page button */}
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									className="disabled:pointer-events-none disabled:opacity-50"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
									aria-label="Go to previous page"
								>
									<ChevronLeftIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
							{/* Next page button */}
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									className="disabled:pointer-events-none disabled:opacity-50"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
									aria-label="Go to next page"
								>
									<ChevronRightIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
							{/* Last page button */}
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									className="disabled:pointer-events-none disabled:opacity-50"
									onClick={() => table.lastPage()}
									disabled={!table.getCanNextPage()}
									aria-label="Go to last page"
								>
									<ChevronLastIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>
			<CreateProductModal
				open={openCreateModal}
				onOpenChange={(open) => {
					setOpenCreateModal(open);
					if (!open) handleAfterChange();
				}}
			/>
			{selectedProduct && (
				<EditProductModal
					open={openEditModal}
					onOpenChange={(open) => {
						setOpenEditModal(open);
						if (!open) {
							setSelectedProduct(null);
							handleAfterChange();
						}
					}}
					product={{
						id: selectedProduct.id,
						name: selectedProduct.name,
						description: selectedProduct.description ?? "",
					}}
				/>
			)}
			<ProductDetailModal
				open={openDetailModal}
				onOpenChange={setOpenDetailModal}
				productId={selectedProductId}
				onTokenRegenerated={refetch}
			/>
		</div>
	);
}
