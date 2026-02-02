import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = 
  | "admin" 
  | "consultor"
  | "gerente_varejo" 
  | "varejo" 
  | "gerente_industria" 
  | "industria" 
  | "gerente_exportacao" 
  | "exportacao";

export type Sector = "varejo" | "industria" | "exportacao" | null;

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  consultor: "Consultor",
  gerente_varejo: "Gerente Varejo",
  varejo: "Varejo",
  gerente_industria: "Gerente Indústria",
  industria: "Indústria",
  gerente_exportacao: "Gerente Exportação",
  exportacao: "Exportação",
};

export const SECTOR_FROM_ROLE: Record<AppRole, Sector> = {
  admin: null,
  consultor: null,
  gerente_varejo: "varejo",
  varejo: "varejo",
  gerente_industria: "industria",
  industria: "industria",
  gerente_exportacao: "exportacao",
  exportacao: "exportacao",
};

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching role:", error);
          setRole("varejo"); // Default to varejo
        } else {
          setRole((data?.role as AppRole) || "varejo");
        }
      } catch (err) {
        console.error("Error:", err);
        setRole("varejo");
      } finally {
        setLoading(false);
      }
    };

    fetchRole();
  }, [user, authLoading]);

  const sector = role ? SECTOR_FROM_ROLE[role] : null;
  
  // Can view all data (admin or consultor)
  const canViewAllData = role === "admin" || role === "consultor";
  
  // Is a manager (can manage their sector's team)
  const isManager = role === "admin" || 
    role === "gerente_varejo" || 
    role === "gerente_industria" || 
    role === "gerente_exportacao";

  return {
    role,
    loading: loading || authLoading,
    isAdmin: role === "admin",
    isConsultor: role === "consultor",
    isManager,
    canViewAllData,
    sector,
    roleLabel: role ? ROLE_LABELS[role] : "",
  };
}
