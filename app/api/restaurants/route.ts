import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, review_url")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, review_url } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name e slug são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("restaurants")
      .insert([{ name, slug, review_url }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar restaurante." },
      { status: 500 }
    );
  }
}