import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const testUsers = [
    { email: "admin@annadanam.test", password: "Admin@123", name: "Admin User", role: "admin" },
    { email: "volunteer@annadanam.test", password: "Volunteer@123", name: "Ravi Kumar", role: "volunteer" },
    { email: "receiver@annadanam.test", password: "Receiver@123", name: "Manjusha Devi", role: "receiver" },
    { email: "donor@annadanam.test", password: "Donor@123", name: "Suresh Reddy", role: "donor" },
  ];

  const results = [];

  for (const u of testUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((eu: any) => eu.email === u.email);

    if (existing) {
      results.push({ email: u.email, status: "already_exists" });
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name },
    });

    if (error) {
      results.push({ email: u.email, status: "error", error: error.message });
      continue;
    }

    if (data.user) {
      // Update profile name
      await supabase.from("profiles").update({ name: u.name }).eq("user_id", data.user.id);
      // Insert role
      await supabase.from("user_roles").insert({ user_id: data.user.id, role: u.role });
      results.push({ email: u.email, status: "created", role: u.role });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
