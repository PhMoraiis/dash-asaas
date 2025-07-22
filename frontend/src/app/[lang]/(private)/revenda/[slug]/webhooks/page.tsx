/** biome-ignore-all lint/suspicious/noExplicitAny: ignore */
"use client";

import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { z } from "zod";
import { useMemo, useRef, useState } from "react";
import {
	flexRender,
	getCoreRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type ColumnFiltersState,
	type PaginationState,
	type SortingState,
	type VisibilityState,
	type FilterFn,
} from "@tanstack/react-table";
import {
	ChevronFirstIcon,
	ChevronLastIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ListFilterIcon,
	RefreshCwIcon,
	ChevronUpIcon,
	ChevronDownIcon,
	Columns3Icon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
} from "@/components/ui/pagination";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { WebhookDetailModal } from "./_components/webhook-detail-modal";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDictionary } from "@/hooks/use-dictionary";

const webhookSchema = z.object({
	id: z.string(),
	produtoId: z.string().nullable(),
	createdAt: z.string(),
	payload: z.record(z.any()),
});

type Webhook = {
	id: string;
	produtoId: string | null;
	createdAt: string;
	payload: Record<string, any>;
};

const _multiColumnFilterFn: FilterFn<Webhook> = (
	row,
	_columnId,
	filterValue,
) => {
	const payload = row.original.payload || {};
	const searchableRowContent =
		`${payload.event ?? ""} ${payload.status ?? ""}`.toLowerCase();
	const searchTerm = (filterValue ?? "").toLowerCase();
	return searchableRowContent.includes(searchTerm);
};

export default function WebhooksPage() {
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 10,
	});
	const [sorting, setSorting] = useState<SortingState>([
		{ id: "createdAt", desc: true },
	]);
	const _inputRef = useRef<HTMLInputElement>(null);
	const [openDetailModal, setOpenDetailModal] = useState(false);
	const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null);
	const dict = useDictionary();

	// Buscar webhooks
	const fetchWebhooks = async () => {
		const res = await fetchWithAuth(
			`${process.env.NEXT_PUBLIC_API_URL}/api/webhooks`,
		);
		if (!res.ok) throw new Error("Erro ao buscar webhooks");
		const data = await res.json();
		return z.array(webhookSchema).parse(data);
	};

	const {
		data: webhooksData = [],
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["webhooks"],
		queryFn: fetchWebhooks,
		staleTime: 1000 * 60,
	});

	const data = useMemo(() => webhooksData, [webhooksData]);

	const eventFilterFn: FilterFn<Webhook> = (
		row,
		_columnId,
		filterValue: string[],
	) => {
		if (!filterValue?.length) return true;
		const event = row.original.payload?.event as string;
		return filterValue.includes(event);
	};

	// Buscar produtos da revenda logada
	const fetchProdutos = async () => {
		const res = await fetchWithAuth(
			`${process.env.NEXT_PUBLIC_API_URL}/api/products`,
		);
		if (!res.ok) throw new Error("Erro ao buscar produtos");
		return await res.json(); // [{ id, name, ... }]
	};

	const { data: produtos = [] } = useQuery({
		queryKey: ["produtos"],
		queryFn: fetchProdutos,
		staleTime: 1000 * 60,
	});

	const produtoMap = useMemo(() => {
		const map: Record<string, string> = {};
		produtos.forEach((p: { id: string; name: string }) => {
			map[p.id] = p.name;
		});
		return map;
	}, [produtos]);

	const columns: ColumnDef<Webhook>[] = [
		{
			id: "event",
			header: `${dict.webhookTable.event}`,
			accessorKey: "payload.event",
			cell: ({ row }) => <span>{row.original.payload?.event ?? "-"}</span>,
			size: 180,
			enableHiding: false,
			filterFn: eventFilterFn,
		},
		{
			id: "status",
			header: "Status",
			accessorKey: "payload.status",
			cell: ({ row }) => {
				const status =
					row.original.payload?.status || row.original.payload?.payment?.status;
				return <Badge>{status ?? "NO STATUS"}</Badge>;
			},
			size: 120,
		},
		{
			id: "product",
			header: `${dict.webhookTable.product}`,
			accessorKey: "produtoId",
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground">
					{produtoMap[row.original.produtoId ?? ""] || "-"}
				</span>
			),
			size: 180,
		},
		{
			id: "createdAt",
			header: `${dict.webhookTable.createdAt}`,
			accessorKey: "createdAt",
			size: 140,
			cell: ({ row }) => (
				<span className="text-xs text-muted-foreground">
					{new Date(row.original.createdAt).toLocaleString("pt-BR")}
				</span>
			),
		},
		{
			id: "actions",
			header: "Ações",
			cell: ({ row }) => (
				<Button
					variant="outline"
					size="sm"
					className="cursor-pointer flex items-center justify-center"
					onClick={() => {
						setSelectedWebhook(row.original);
						setOpenDetailModal(true);
					}}
				>
					{dict.webhookTable.details}
				</Button>
			),
			size: 100,
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

	// Filtro de eventos
	const uniqueEventValues = useMemo(() => {
		const set = new Set<string>();
		data.forEach((w) => {
			if (w.payload?.event) set.add(w.payload.event);
		});
		return Array.from(set);
	}, [data]);
	const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

	const handleEventChange = (checked: boolean, value: string) => {
		const newFilter = checked
			? [...selectedEvents, value]
			: selectedEvents.filter((v) => v !== value);
		setSelectedEvents(newFilter);
		table
			.getColumn("event")
			?.setFilterValue(newFilter.length ? newFilter : undefined);
	};

	return (
		<div className="space-y-4 px-6 py-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					{/* Filtro por evento com Popover */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="outline">
								<ListFilterIcon
									className="-ms-1 opacity-60"
									size={16}
									aria-hidden="true"
								/>
								{dict.table.filters}
								{selectedEvents.length > 0 && (
									<span className="bg-background text-muted-foreground/70 -me-1 inline-flex h-5 max-h-full items-center rounded border px-1 font-[inherit] text-[0.625rem] font-medium">
										{selectedEvents.length}
									</span>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-auto min-w-36 p-3" align="start">
							<div className="space-y-3">
								<div className="text-muted-foreground text-xs font-medium">
									{dict.webhookTable.events}
								</div>
								<div className="space-y-3">
									{uniqueEventValues.map((value, i) => (
										<div key={value} className="flex items-center gap-2">
											<Checkbox
												id={`event-${i}`}
												checked={selectedEvents.includes(value)}
												onCheckedChange={(checked: boolean) =>
													handleEventChange(checked, value)
												}
											/>
											<Label
												htmlFor={`event-${i}`}
												className="flex grow justify-between gap-2 font-normal"
											>
												{value}
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
								{dict.table.view}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuLabel>{dict.table.toggleColumns}</DropdownMenuLabel>
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
				</div>
			</div>
			<div className="bg-background overflow-hidden rounded-md border">
				<Table className="table-fixed">
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id} className="hover:bg-transparent">
								{headerGroup.headers.map((header) => (
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
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
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
									{dict.table.noResults}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-between gap-8">
				<div className="flex items-center gap-3">
					<Label htmlFor="rows-per-page" className="max-sm:sr-only">
						{dict.table.rowsPerPage}
					</Label>
					<select
						value={table.getState().pagination.pageSize}
						onChange={(e) => table.setPageSize(Number(e.target.value))}
						className="border rounded px-2 py-1"
					>
						{[5, 10, 25, 50].map((pageSize) => (
							<option key={pageSize} value={pageSize}>
								{pageSize}
							</option>
						))}
					</select>
				</div>
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
						de{" "}
						<span className="text-foreground">
							{table.getRowCount().toString()}
						</span>
					</p>
				</div>
				<div>
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									onClick={() => table.firstPage()}
									disabled={!table.getCanPreviousPage()}
									aria-label="Primeira página"
								>
									<ChevronFirstIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									onClick={() => table.previousPage()}
									disabled={!table.getCanPreviousPage()}
									aria-label="Página anterior"
								>
									<ChevronLeftIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									onClick={() => table.nextPage()}
									disabled={!table.getCanNextPage()}
									aria-label="Próxima página"
								>
									<ChevronRightIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
							<PaginationItem>
								<Button
									size="icon"
									variant="outline"
									onClick={() => table.lastPage()}
									disabled={!table.getCanNextPage()}
									aria-label="Última página"
								>
									<ChevronLastIcon size={16} aria-hidden="true" />
								</Button>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			</div>
			<WebhookDetailModal
				open={openDetailModal}
				onOpenChange={setOpenDetailModal}
				webhook={selectedWebhook}
			/>
		</div>
	);
}
