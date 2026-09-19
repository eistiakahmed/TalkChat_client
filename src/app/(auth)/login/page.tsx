'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input, Spinner } from '../../../components/ui';
import { authService } from '../../../services/auth.service';
import { useAuthStore } from '../../../stores/auth.store';
import { ApiError } from '../../../services/api.client';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

/**
 * TalkChat Login Page.
 * 
 * Supports credential-based authentication using email or username,
 * persists JWT session in local storage, and routes to active chat view.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages
 */
export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [loginIdentifier, setLoginIdentifier] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !password) {
      setErrorMessage('Please enter both your identifier and password');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.login({
        login: loginIdentifier.trim(),
        password,
      });

      setAuth(result.user, result.tokens);
      router.push('/chat');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-2xl bg-card border border-border shadow-lg shadow-black/5 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to access your encrypted conversations
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email or Username"
          placeholder="e.g. user@example.com or username"
          value={loginIdentifier}
          onChange={(e) => setLoginIdentifier(e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="username"
          required
        />

        <div className="space-y-1.5">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-foreground transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            }
            autoComplete="current-password"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLoading}
        >
          <span>Sign In</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="pt-2 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-all"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}
