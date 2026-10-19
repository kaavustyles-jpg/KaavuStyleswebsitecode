"use client";
import { useParams } from "next/navigation";
import ProductEditor from "@/components/ProductEditor";
export default function EditProductPage() { const params = useParams<{ id: string }>(); return <ProductEditor key={params.id} productId={params.id} />; }
