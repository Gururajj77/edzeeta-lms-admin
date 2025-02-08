"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useAuth } from "@/app/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      router.push("/dashboard/add-user");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // No need to manually redirect - AuthContext will handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/30 px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-[400px] sm:max-w-[440px]">
        <CardHeader className="space-y-2 pb-6 pt-8">
          <div className="flex justify-center w-full px-4 sm:px-6">
            <div className="relative w-48 h-12 sm:w-56 sm:h-14">
              <Image
                src="/EdzeetaLogo.svg"
                alt="Edzeeta Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
          <CardTitle className="text-xl font-bold text-center sm:text-2xl pt-4">
            Sign in
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              type="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 sm:h-11"
            />
            <Input
              id="password"
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 sm:h-11"
            />
            <Button
              type="submit"
              className="w-full bg-[#004aad] hover:bg-[#004aad]/90 h-10 sm:h-11 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle className="text-sm sm:text-base">Error</AlertTitle>
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
