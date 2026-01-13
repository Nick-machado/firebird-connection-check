import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Database, CheckCircle2, XCircle, Loader2, FileSpreadsheet } from "lucide-react";

type ConnectionStatus = "idle" | "loading" | "success" | "error";

const Index = () => {
  const [apiUrl, setApiUrl] = useState("http://localhost:3001");
  const [status, setStatus] = useState<ConnectionStatus>("idle");
  const [message, setMessage] = useState("");

  const testConnection = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(`${apiUrl}/api/test-connection`);
      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
      } else {
        setStatus("error");
        setMessage(data.error || "Falha na conexão");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Não foi possível conectar à API. Verifique se o servidor está rodando.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
            <Database className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Teste de Conexão</CardTitle>
          <CardDescription>
            Firebird Database - HM Rubber
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              URL da API
            </label>
            <Input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:3001"
              className="bg-input-background"
            />
          </div>

          <Button
            onClick={testConnection}
            disabled={status === "loading"}
            className="w-full"
            size="lg"
          >
            {status === "loading" ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testando...
              </>
            ) : (
              "Testar Conexão"
            )}
          </Button>

          {status !== "idle" && status !== "loading" && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                status === "success"
                  ? "bg-success/10 border border-success/20"
                  : "bg-destructive/10 border border-destructive/20"
              }`}
            >
              {status === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              )}
              <div>
                <p
                  className={`font-medium ${
                    status === "success" ? "text-success" : "text-destructive"
                  }`}
                >
                  {status === "success" ? "Sucesso!" : "Erro"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{message}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-4">
            <p className="text-xs text-muted-foreground text-center">
              Conectando a: <span className="font-mono">mk.rpsolution.com.br:30509</span>
            </p>
            
            <Link to="/vendas">
              <Button variant="outline" className="w-full">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Relatório de Vendas
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
