'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '../../../components/ui';
import { authService } from '../../../services/auth.service';
import { useAuthStore } from '../../../stores/auth.store';
import { ApiError } from '../../../services/api.client';
import { User as UserIcon, AtSign, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * TalkChat Registration Page.
 * 
 * Enforces client-side credential verification, real-time password matching,
 * creates user record via backend POST /auth/register, and hydrates active session.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/routing/pages
 */
export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [formData, setFormData] = React.useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const isPasswordMatch =
    formData.password.length > 0 &&
    formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username.trim())) {
      setErrorMessage('Username must be 3-30 characters (letters, numbers, underscores only)');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await authService.register({
        fullName: formData.fullName.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      setAuth(result.user, result.tokens);
      router.push('/chat');
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create account. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-2xl bg-card border border-border shadow-lg shadow-black/5 space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Create an account
        </h1>
        <p className="text-sm text-muted-foreground">
          Join TalkChat with encrypted communication
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <Input
          label="Full Name"
          placeholder="e.g. Alice Johnson"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          leftIcon={<UserIcon className="w-4 h-4" />}
          autoComplete="name"
          required
        />

        <Input
          label="Username"
          placeholder="e.g. alice_j"
          value={formData.username}
          onChange={(e) => handleChange('username', e.target.value)}
          leftIcon={<AtSign className="w-4 h-4" />}
          autoComplete="username"
          required
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="e.g. alice@example.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
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
          autoComplete="new-password"
          required
        />

        <div className="space-y-1">
          <Input
            label="Confirm Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            rightIcon={
              isPasswordMatch ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : null
            }
            autoComplete="new-password"
            required
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-3"
          isLoading={isLoading}
          disabled={isLoading}
        >
          <span>Create Account</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </form>

      <div className="pt-2 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-semibold text-brand-600 dark:text-brand-400 hover:underline transition-all"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
