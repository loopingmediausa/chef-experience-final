import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("servers")
    .select(`
      id,
      name,
      code,
      restaurant_id,
      restaurants (
        slug,
        name
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, restaurant_id } = body;

    if (!name || !code || !restaurant_id) {
      return NextResponse.json(
        { error: "Name, code e restaurant_id são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("servers")
      .insert([{ name, code, restaurant_id }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Erro ao criar server." },
      { status: 500 }
    );
  }
}