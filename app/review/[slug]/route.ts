import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params;
  const url = new URL(request.url);
  const serverCode = url.searchParams.get("server");

  const { data: restaurant, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, slug, review_url")
    .eq("slug", slug)
    .single();

  if (restaurantError || !restaurant) {
    return NextResponse.json(
      { error: "Restaurant not found." },
      { status: 404 }
    );
  }

  if (!restaurant.review_url) {
    return NextResponse.json(
      { error: "Review URL not configured for this restaurant." },
      { status: 400 }
    );
  }

  let serverId: string | null = null;

  if (serverCode) {
    const { data: server } = await supabase
      .from("servers")
      .select("id, code")
      .eq("restaurant_id", restaurant.id)
      .eq("code", serverCode)
      .maybeSingle();

    if (server) {
      serverId = server.id;
    }
  }

  const sessionId = `review-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  await supabase.from("events").insert([
    {
      restaurant_id: restaurant.id,
      server_id: serverId,
      event_type: "review_click",
      event_value: serverCode ?? "no_server",
      session_id: sessionId,
    },
  ]);

  return NextResponse.redirect(restaurant.review_url, 302);
}