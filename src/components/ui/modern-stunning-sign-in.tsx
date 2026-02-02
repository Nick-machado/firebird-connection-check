"use client";

import * as React from "react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Mail, Lock, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Por favor, insira um email válido");
const passwordSchema = z.string().min(6, "A senha deve ter no mínimo 6 caracteres");

interface SignIn1Props {
  onToggleMode?: () => void;
  isSignUp?: boolean;
}

const SignIn1 = ({ onToggleMode, isSignUp = false }: SignIn1Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async () => {
    setError("");
    
    // Validate email
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError(emailResult.error.errors[0].message);
      return;
    }
    
    // Validate password
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      setError(passwordResult.error.errors[0].message);
      return;
    }

    if (isSignUp && !fullName.trim()) {
      setError("Por favor, insira seu nome completo");
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName.trim(),
            },
          },
        });
        if (error) throw error;
        setError("");
        alert("Verifique seu email para confirmar o cadastro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      {/* Centered glass card */}
      <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
            <TrendingUp className="h-8 w-8 text-primary" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-center text-foreground mb-2">
          HM Rubber
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {isSignUp ? "Crie sua conta" : "Acesse seu dashboard"}
        </p>

        {/* Form */}
        <div className="space-y-4">
          {isSignUp && (
            <div className="relative">
              <input
                type="text"
                placeholder="Nome completo"
                className="w-full h-12 px-4 pl-11 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                👤
              </span>
            </div>
          )}

          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              className="w-full h-12 px-4 pl-11 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              className="w-full h-12 px-4 pl-11 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            onClick={handleAuth}
            disabled={loading}
            className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSignUp ? "Criar conta" : "Entrar"}
          </button>

          <div className="text-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
              <button
                onClick={onToggleMode}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? "Entrar" : "Cadastre-se"}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Dashboard de vendas para a equipe HM Rubber
        </p>
      </div>
    </div>
  );
};

export { SignIn1 };
