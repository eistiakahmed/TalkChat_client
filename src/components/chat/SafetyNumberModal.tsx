'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Copy, Check, QrCode, Lock } from 'lucide-react';
import { Modal, Avatar, Button, Spinner } from '../ui';
import { e2eeService } from '../../services/e2ee.service';
import type { ParticipantUser } from '../../types/chat.types';

interface SafetyNumberModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: ParticipantUser | null;
}

/**
 * End-to-End Encryption Safety Number Verification Modal.
 * 
 * Displays the 60-digit symmetrical cryptographic fingerprint derived from
 * both parties' public identity keys. Used to verify contact identity and
 * guard against Man-In-The-Middle (MITM) attacks.
 * 
 * @see https://signal.org/docs/specifications/x3dh/
 */
export function SafetyNumberModal({
  isOpen,
  onClose,
  targetUser,
}: SafetyNumberModalProps) {
  const [copied, setCopied] = React.useState(false);
  const [isVerified, setIsVerified] = React.useState(false);

  // Load persistent verification status from localStorage
  React.useEffect(() => {
    if (targetUser?.id) {
      const verifiedKey = `e2ee_verified_${targetUser.id}`;
      setIsVerified(localStorage.getItem(verifiedKey) === 'true');
    }
  }, [targetUser?.id, isOpen]);

  // Fetch 60-digit safety number from backend
  const { data, isLoading, isError } = useQuery({
    queryKey: ['safetyNumber', targetUser?.id],
    queryFn: () => e2eeService.getSafetyNumber(targetUser!.id),
    enabled: isOpen && !!targetUser?.id,
  });

  const safetyNumber = data?.safetyNumber || '';
  const blocks = safetyNumber.split(' ').filter(Boolean);

  const handleCopy = () => {
    if (safetyNumber) {
      navigator.clipboard.writeText(safetyNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleToggleVerified = () => {
    if (targetUser?.id) {
      const nextVal = !isVerified;
      setIsVerified(nextVal);
      localStorage.setItem(`e2ee_verified_${targetUser.id}`, String(nextVal));
    }
  };

  if (!targetUser) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Safety Number"
      description={`Compare this number with ${targetUser.fullName || targetUser.username} to confirm end-to-end encryption.`}
    >
      <div className="space-y-5 pt-2 select-none">
        {/* Contact Header */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-card border border-border">
          <Avatar
            src={targetUser.avatarUrl}
            name={targetUser.fullName || targetUser.username}
            size="md"
          />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-foreground truncate">
              {targetUser.fullName || targetUser.username}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              @{targetUser.username}
            </p>
          </div>
          {isVerified && (
            <div className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* 60-Digit Fingerprint Canvas */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Spinner size="lg" />
            <p className="text-xs text-muted-foreground animate-pulse">
              Deriving cryptographic fingerprint...
            </p>
          </div>
        ) : isError ? (
          <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-center space-y-2">
            <p className="text-xs font-semibold text-danger">
              Public key bundle not found for contact
            </p>
            <p className="text-[11px] text-muted-foreground">
              Once both users have established active sessions, safety numbers can be compared.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 12 blocks of 5 digits displayed in a grid */}
            <div className="p-4 rounded-2xl bg-zinc-950 text-white font-mono text-sm tracking-wider border border-zinc-800 shadow-inner">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 text-center">
                {blocks.map((block, idx) => (
                  <span
                    key={idx}
                    className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800/80 font-bold text-brand-400"
                  >
                    {block}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="w-full"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5 text-emerald-500" />
                    Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1.5" />
                    Copy Safety Number
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Security Guidance Note */}
        <div className="p-3 rounded-2xl bg-muted/50 border border-border flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            If the numbers match the ones on your contact&apos;s phone, your conversation is guaranteed to be secure and cannot be intercepted by any third party.
          </p>
        </div>

        {/* Mark as Verified Toggle */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-foreground">
              Mark as Verified
            </p>
            <p className="text-[11px] text-muted-foreground">
              Show a verified security badge on this contact
            </p>
          </div>
          <Button
            variant={isVerified ? 'primary' : 'outline'}
            size="sm"
            onClick={handleToggleVerified}
          >
            {isVerified ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1" />
                Verified
              </>
            ) : (
              'Mark Verified'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
